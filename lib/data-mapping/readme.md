# About the mapper

### The mapper is temporary.
The mapper is a solution to a temporary migration problem. It creates a hook-oriented, reversable, import/export adapter for our models. It allows us to munge data, but it will be depreciated when we migrate.

### The mapper is slow.
The mapper is slow because of the operations needed to normalize and then insert documents. Bulk inserts would certainly be way faster, but this doesn't allow us to loop and munge data in the inject hook.
