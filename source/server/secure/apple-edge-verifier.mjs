/* Apple library 3.1.0 certificate-chain/OCSP policy, with an Edge-compatible
 * certificate adapter. No trust, marker, signature, date or revocation bypass.
 * Upstream policy: https://github.com/apple/app-store-server-library-node
 */
import {Buffer} from 'node:buffer';
import {createPublicKey,createHash,verify} from 'node:crypto';
import jsrsasign from 'jsrsasign';
import jwt from 'jsonwebtoken';
import {SignedDataVerifier,VerificationException,VerificationStatus} from '@apple/app-store-server-library';
const {X509,KEYUTIL}=jsrsasign;
const MAX_SKEW=60000;
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
 // jsrsasign emits OCSP GeneralizedTime as YYYYMMDDTHHmmssZ. Reject
 // malformed dates explicitly; never let Invalid Date bypass freshness checks.
 parseX509Date(value){
  const normalized=typeof value==='string'?value.replace('T',''):'';
  if(!/^\d{14}Z?$/.test(normalized))throw new VerificationException(VerificationStatus.INVALID_CERTIFICATE);
  return new Date(certificateDate(normalized.endsWith('Z')?normalized:normalized+'Z'));
 }
 // Adapted from Apple MIT-licensed checkOCSPStatus (see APPLE_LIBRARY_NOTICE.txt).
    async checkOCSPStatus(cert, issuer) {
        const authorityRex = /^OCSP - URI:(.*)$/m;
        const matchResult = cert.infoAccess ? authorityRex.exec(cert.infoAccess) : "";
        if (matchResult === null || matchResult.length !== 2) {
            throw new VerificationException(VerificationStatus.INVALID_CERTIFICATE);
        }
        const request = new jsrsasign.KJUR.asn1.ocsp.OCSPRequest({ reqList: [{ issuerCert: issuer.toString(), subjectCert: cert.toString(), alg: "sha256" }] });
        const headers = new Headers();
        headers.append('Content-Type', 'application/ocsp-request');
        let response;
        try {
            response = await fetch(matchResult[1], {
                headers: headers,
                method: 'POST',
                body: Buffer.from(request.getEncodedHex(), 'hex'),
                signal: AbortSignal.timeout(30000)
            });
            if (!response.ok) {
                throw new VerificationException(VerificationStatus.RETRYABLE_VERIFICATION_FAILURE);
            }
        }
        catch (error) {
            if (error instanceof VerificationException) {
                throw error;
            }
            // Network errors
            throw new VerificationException(VerificationStatus.RETRYABLE_VERIFICATION_FAILURE, error instanceof Error ? error : undefined);
        }
        const responseBuffer = Buffer.from(await response.arrayBuffer());
        const parsedResponse = new jsrsasign.KJUR.asn1.ocsp.OCSPParser().getOCSPResponse(responseBuffer.toString('hex'));
        // The issuer could also be the signer
        const jsrassignX509Issuer = new X509();
        jsrassignX509Issuer.readCertHex(issuer.raw.toString('hex'));
        const allCerts = [jsrassignX509Issuer];
        for (const certHex of parsedResponse.certs) {
            const cert = new X509();
            cert.readCertHex(certHex);
            allCerts.push(cert);
        }
        let signingCert = null;
        if (parsedResponse.respid.key) {
            for (const cert of allCerts) {
                const shasum = createHash('sha1');
                shasum.update(Buffer.from(cert.getSPKIValue(), 'hex'));
                const spkiHash = shasum.digest('hex');
                if (spkiHash === parsedResponse.respid.key) {
                    signingCert = new EdgeCertificate(Buffer.from(cert.hex, 'hex'));
                }
            }
        }
        else if (parsedResponse.respid.name) {
            for (const cert of allCerts) {
                if (cert.getSubject().str === parsedResponse.respid.name.str) {
                    signingCert = new EdgeCertificate(Buffer.from(cert.hex, 'hex'));
                }
            }
        }
        if (signingCert == null) {
            throw new VerificationException(VerificationStatus.FAILURE);
        }
        // Verify Signing Cert is issued by issuer
        if (Buffer.from(signingCert.publicKey.export({type:'spki',format:'der'})).equals(Buffer.from(issuer.publicKey.export({type:'spki',format:'der'}))) && signingCert.subject === issuer.subject) {
            // This is directly signed by the issuer
        }
        else if (signingCert.verify(issuer.publicKey)) {
            // This is issued by the issuer, let's check the dates and purpose
            const signingCertAssign = new X509();
            signingCertAssign.readCertPEM(signingCert.toString());
            if (!signingCertAssign.getExtExtKeyUsage().array.includes("ocspSigning")) {
                throw new VerificationException(VerificationStatus.INVALID_CERTIFICATE);
            }
            this.checkDates(signingCert, new Date());
        }
        else {
            throw new VerificationException(VerificationStatus.INVALID_CERTIFICATE);
        }
        // Extract raw responseData
        const responseData = jsrsasign.ASN1HEX.getTLVbyList(responseBuffer.toString('hex'), 0, [1, 0, 1, 0, 0]);
        // Verify Payload signed by cert
        const shortAlg = parsedResponse.alg.substring(0, 6).toUpperCase();
        if (shortAlg !== "SHA256" && shortAlg !== "SHA384" && shortAlg !== "SHA512") {
            throw new VerificationException(VerificationStatus.FAILURE);
        }
        if (!verify(shortAlg, Buffer.from(responseData, 'hex'), signingCert.publicKey, Buffer.from(parsedResponse.sighex, 'hex'))) {
            throw new VerificationException(VerificationStatus.FAILURE);
        }
        for (const singleResponse of parsedResponse.array) {
            // Confirm entry is for this cert
            const certIdBuilder = new jsrsasign.KJUR.asn1.ocsp.CertID();
            const currentCertCertId = certIdBuilder.getParamByCerts(issuer.toString(), cert.toString(), 'sha256');
            if (!(currentCertCertId.alg === singleResponse.certid.alg && currentCertCertId.issname === singleResponse.certid.issname &&
                currentCertCertId.isskey === singleResponse.certid.isskey && currentCertCertId.sbjsn === singleResponse.certid.sbjsn)) {
                continue;
            }
            // Validate contents
            const issueDate = this.parseX509Date(singleResponse.thisupdate);
            const nextDate = this.parseX509Date(singleResponse.nextupdate);
            if (singleResponse.status.status !== 'good' || new Date().getTime() + MAX_SKEW < issueDate.getTime() || nextDate.getTime() < new Date().getTime() - MAX_SKEW) {
                throw new VerificationException(VerificationStatus.FAILURE);
            }
            // Success
            return;
        }
        throw new VerificationException(VerificationStatus.FAILURE);
    }

}
