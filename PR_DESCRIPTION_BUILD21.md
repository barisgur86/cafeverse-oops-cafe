# Align seated sessions, door pickup and guest queue for Build21

The service modal used different seat positions and layered Melo over the third guest; standing sprites appeared on chair backs. Entrance artwork always drew two guests, independently of the queue, and pickup consumed that queue and lacked an exterior customer.

Share canonical guest IDs, cushion slots and seated artwork composition across scene/service; separate occupancy from product quantity. Preserve Build20’s once-only delivery controller. Make pickup admission independent while retaining table quotas and existing atomic settlement, show the same pickup at the door through reentry and retry, and animate exterior bag handoff/departure. Render entrance guests from the queue, preserve the server cooldown, remove balloon body text and hide all deflated body layers.

Validation: complete automated suite plus Table1 pairs/Table2 pairs and triples, all seats, quantity separation, zero/nonzero queue pickup, arrival failure/reentry, two call rounds and table/package response/error/timeout/retry/double-tap/reopen scenarios. Supabase Sandbox engine deployed and health/auth probes verified; other modules unchanged. Original raster hashes preserved. Native archive/video attempted but execution environment blocks Swift macros and Chrome launch; physical acceptance/TestFlight21 are not claimed. See BUILD_21_REPORT.md.
