const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const hbs = require('handlebars');
const port = 3000;
const url = require('url');

const mongoose = require('mongoose')
const multer = require('multer');
const path = require('path')
app.use(express.static('views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'hbs');

mongoose.connect("mongodb+srv://aayushpoudel:QhN70gJ6oHTIVSmD@cluster0.fem0aph.mongodb.net/metroTarkari",{
    useNewUrlParser: true,
    useUnifiedTopology:true
})
const productSchema = new mongoose.Schema({
  imagePath: {
    type: String,
    required: true
  },
  Price: {
    type: Number
  },
  Name: {
    type:String
  },
  Category: {
    type:String
  }
});
app.use('/uploads', express.static('uploads'));


const Product = mongoose.model('product', productSchema);
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, callback) => {
    callback(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage
}).single('image');


app.post('/edit',async(req,res)=> {
  let findQuery={Name:req.body.vegName}
  let newValues = {$set:{Name:req.body.vegName,Price:req.body.vegPrice,Category:req.body.category}}
  Product.updateOne(findQuery, newValues).then((result) => {
    if (result.nModified === 0) {
      // If no product with the given name is found
      res.status(404).send('Product not found');
    } else {
      res.redirect('/admin');
    }
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('An error occurred');
  });
})

app.get('/', async (req, res) => {
  Product.find({})
  .sort({ createdAt: -1 }) // Sort in descending order based on the createdAt field
  .limit(6) // Limit the results to 6 documents
  .exec().then((products) => {
    res.render('home', { products });
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('An error occurred');
  });
    
});

app.get('/admin',async(req,res)=>{
  let data = await Product.find()
  res.render('admin',{tableData:data})
})
app.post('/upload', async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      // Handle error
      console.error(err);
      res.status(500).send('An error occurred');
    } else {
      if (req.file === undefined) {
        // No file selected
        res.status(400).send('No file selected');
      } else {
        // File uploaded successfully
        // Save the fields to MongoDB using Mongoose
        const { name, price, category } = req.body;
        const imagePath = req.file.path;
        const prod = new Product({
          Name: name,
          Price: price,
          Category: category,
          imagePath: imagePath
        });
        let result = await prod.save()
        if(result)
        {
          const redirectUrl = url.format({
            pathname: '/admin',
            query: {
              msg: 'Added Successfully'
            }
          });
          res.redirect(redirectUrl);

        }
      }
    }
  });
});


app.get("/category",async(req,res)=>{
  let veg = await Product.find({'Category':'vegetable'})
  let fru = await Product.find({'Category':'fruits'})
  let spice = await Product.find({'Category':'spices'})
  let others = await Product.find({'Category':'others'})

  res.render('category',{veg,fru,spice,others})
})


app.post("/delete",async(req,res)=>{
  Product.deleteOne({Name:req.body.deleteName}).exec()
  .then(() => {
    res.render('admin',{delmsg:'Item deleted successfully'});
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('An error occurred');
  });
  
})
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});