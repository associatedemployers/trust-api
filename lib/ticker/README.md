# Ticker Module
### Document History Tracking

This module enables us to track, rollback, and do a ton more with document histories and such.

The module adds these critical features to the system:
+ **Change History**
  + Queryable
+ **Audits**
  + Stores user that changed document
  + Stores time of change
+ **Readable Change Descriptor**
  *ex. Properties Changed/Deleted/Added by user {ObjectId}*
+ **Rollbacks**
  + Stores both updated and old document for rollbacks and auditing
+ **Detailed Change Log**
  + Change type
  + Left/Right side values via deep-diff module
  + Path
+ **Backdating**
+ **Per Change**
  + Notes!
  + Flags! ( Like `Mistake` )
+ **Systematic Calculations (BL)**
  + Effective Date
  + **FUTURE:**
    + Adjustment Calculation
