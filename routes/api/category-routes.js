const router = require('express').Router();
const { Category, Product } = require('../../models');

// The `/api/categories` endpoint

router.get('/', async (req, res) => {
  // find all categories and associated products
  try{
    const category = await Category.findAll({
      include: [{model: Product}]
    });

  const categories = category.map((category) => category.get(
    { plain: true })
    );
    res.status(200).json(categories);
  } catch (err) { 
    console.log(err);
    res.status(500).json(err); }

});

router.get('/:id', (req, res) => {
  // find one category by its `id` value
  // be sure to include its associated Products
  try{
    const category = Category.findByPk(req.params.id, {
      include: [{model: Product}]
    });
    res.status(200).json(category);
  } catch (err) { 
    res.status(500).json(err); }
});

router.post('/', (req, res) => {
  // create a new category
  Category.create(req.body)
  .then((category) => {
    if (req.body.productIds.length) {
      const categoryProductIdArr = req.body.productIds.map((product_id) => {
        return {
          category_id: category.id,
          product_id,
        };
      });
      return Category.bulkCreate(categoryProductIdArr);
    }
    res.status(200).json(category);
})
.then((category) => res.status(200).json(category))
.catch((err) => {
  console.log(err);
  res.status(400).json(err);
});
});

router.put('/:id', (req, res) => {
  // update a category by its `id` value
  Category.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((category) => {
      // find all associated tags from ProductTag
      return Category.findAll({ where: { id: req.params.id } });
    })
    .then((category) => {
      // get list of current tag_ids
      const categoryIds = category.map(({ id }) => id);
      // create filtered list of new tag_ids
      const newCategoryIds = req.body.productIds
        .filter((product_id) => !categoryIds.includes(product_id))
        .map((product_id) => {
          return {
            category_id: req.params.id,
            product_id,
          };
        });
      // figure out which ones to remove
      const categoryToRemove = category
        .filter(({ id }) => !req.body.productIds.includes(id))
        .map(({ id }) => id);

      // run both actions
      return Promise.all([
        Category.destroy({ where: { id: categoryToRemove } }),
        Category.bulkCreate(newCategoryIds),
      ]);
    })
    .then((updatedCategory) => res.json(updatedCategory))
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', (req, res) => {
  // delete a category by its `id` value
  Category.destroy({
    where: {
      id: req.params.id,
    },
  })
  .then((deletedCategory) => {
    res.json(deletedCategory)
  })
  .catch((err) => res.status(400).json(err));
});

module.exports = router;
