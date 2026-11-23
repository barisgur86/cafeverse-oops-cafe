/* Apple library 3.1.0 certificate-chain/OCSP policy, with an Edge-compatible
 * certificate adapter. No trust, marker, signature, date or revocation bypass.
 * Upstream policy: https://github.com/apple/app-store-server-library-node
 */
import {Buffer} from 'node:buffer';
import {createPublicKey} from 'node:crypto';
import jsrsasign from 'jsrsasign';
import jwt from 'jsonwebtoken';
import {SignedDataVerifier,VerificationException,VerificationStatus} from '@apple/app-store-server-library';
const {X509,KEYUTIL}=jsrsasign;
function certificateDate(value){
 const match=/^(?:(\d{2})|(\d{4}))(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(value);
 if(!match)throw new Error('Unsupported certificate date');
 const year=match[2]||String(Number(match[1])+(Number(match[1])<50?2000:1900));
 const date=new Date(`${year}-${match[3]}-${match[4]}T${match[5]}:${match[6]}:${match[7]}Z`);
 if(!Number.isFinite(date.getTime()))throw new Error('Invalid certificate date');return date.toUTCString();
}
export class EdgeCertificate {
 constructor(der){
  this.raw=Buffer.from(der);this.pem='-----BEGIN CERTIFICATE-----\n'+this.raw.toString('base64').match(/.{1,64}/g).join('\n')+'\n-----END CERTIFICATE-----\n';
  this.x509=new X509();this.x509.readCertHex(this.raw.toString('hex'));this.x509.aExtInfo||=[];
  this.issuer=this.x509.getIssuerString();this.subject=this.x509.getSubjectString();
  this.ca=this.x509.getExtBasicConstraints()?.cA===true;
  this.validFrom=certificateDate(this.x509.getNotBefore());this.validTo=certificateDate(this.x509.getNotAfter());
  this.publicKey=createPublicKey(KEYUTIL.getPEM(this.x509.getPublicKey()));
  this.infoAccess=(this.x509.getExtAIAInfo()?.ocsp||[]).map(url=>'OCSP - URI:'+url).join('\n');
 }
 toString(){return this.pem;}
 verify(publicKey){try{return this.x509.verifySignature(KEYUTIL.getKey(publicKey.export({type:'spki',format:'pem'})))===true}catch{return false}}
}
export class EdgeSignedDataVerifier extends SignedDataVerifier {
 constructor(roots,online,environment,bundleId,appAppleId){
  super(roots,online,environment,bundleId,appAppleId);
  this.rootCertificates=roots.map(root=>new EdgeCertificate(root));
 }
 // Only certificate decoding changes. The inherited official chain verifier
 // still verifies pinned roots, CA flag, both Apple OIDs, dates and live OCSP.
 async verifyJWT(value,validator,signedDateExtractor){
  try{
   if(typeof value!=='string'||value.split('.').length!==3)throw new VerificationException(VerificationStatus.FAILURE);
   const decoded=jwt.decode(value);if(!validator.validate(decoded))throw new VerificationException(VerificationStatus.FAILURE);
   const header=JSON.parse(Buffer.from(value.split('.')[0],'base64url').toString('utf8'));
   if(header.alg!=='ES256'||!Array.isArray(header.x5c)||header.x5c.length!==3)throw new VerificationException(VerificationStatus.INVALID_CERTIFICATE);
   const [leaf,intermediate]=header.x5c.slice(0,2).map(cert=>{if(typeof cert!=='string'||cert.length>20000)throw new VerificationException(VerificationStatus.INVALID_CERTIFICATE);return new EdgeCertificate(Buffer.from(cert,'base64'))});
   const key=await this.verifyCertificateChain(this.rootCertificates,leaf,intermediate,this.enableOnlineChecks?new Date():signedDateExtractor(decoded));
   jwt.verify(value,key.export({type:'spki',format:'pem'}),{algorithms:['ES256']});return decoded;
  }catch(error){if(error instanceof VerificationException)throw error;throw new VerificationException(VerificationStatus.VERIFICATION_FAILURE,error)}
 }
}
