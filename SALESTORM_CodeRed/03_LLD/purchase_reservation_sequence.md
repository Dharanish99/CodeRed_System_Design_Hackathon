# Purchase Reservation Sequence

Purchase and reservation sequence. Duplicate claims are resolved before stock mutation; admission failures do not enter the database. Check the stored hash; function return is not a committed success.

See matching .puml source; all asynchronous arrows use the at-least-once event contracts in 05_API/event_catalog.md.
