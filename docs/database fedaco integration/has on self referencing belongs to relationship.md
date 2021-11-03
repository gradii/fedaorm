## has on self referencing belongs to relationship

```typescript
const parentPost = await FedacoTestPost.createQuery().create({
  name: 'Parent Post',
  user_id: 1
});
await FedacoTestPost.createQuery().create({
  name: 'Child Post',
  parent_id: parentPost.id,
  user_id: 2
});
const results = await FedacoTestPost.createQuery().has('parentPost').get();
```


> | Reference | Looks Like | Value |
> | ------ | ----- | ----- |
> | `head(results).name` | exactly match | `'Child Post'` |


----
see also [prerequisites](./prerequisite.md)