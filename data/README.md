# data/

The course data is **not** in this repository. Put it here before running:

```
data/campus_customs.db      # SQLite: catalogue, inventory, users, chat_messages
data/products/*.jpg         # 102 product images
```

The two JSON files that *are* committed are ours, and are layered over the database at read time:

- `taglines.json`: the catchy one-line card copy for all 102 products.
- `catalogue_overrides.json`: real descriptions/colors/tags for 3 rows whose database text was a placeholder.

The backend adds the `orders` and `product_suggestions` tables (and student-discount columns) on first start.
