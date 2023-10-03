require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');



const multer = require('multer');

// Configurations de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Localisation de stockage des fichiers
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1gb" }));
app.use('/uploads', express.static('uploads'));  // Serveur de fichiers statiques


// N°Port
const PORT = process.env.PORT || 8080;

// MongoDB Connection
console.log(process.env.MONGODB_URL);
mongoose.set('strictQuery', false);

mongoose.connect(process.env.MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connecté à la base de données"))
    .catch((err) => {
        console.error("Erreur de connexion à la base de données:", err);
        process.exit(1); // Exit the application on connection error
    });

// Schema user
const userSchema = mongoose.Schema({
    email: {
        type: String,
        unique: true,
    },
    nom: String,
    password: String,
    cpassword: String,
    profileImage: String,
    role:String
});

// Model user
const userModel = mongoose.model("user", userSchema);

app.post("/addToCart", async (req, res) => {
  const { userId, courseId, qty } = req.body;

  try {
      const user = await userModel.findById(userId);

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      const existingCartItem = user.cart.find(item => item.courseId.toString() === courseId);

      if (existingCartItem) {
          existingCartItem.qty += qty;
      } else {
          user.cart.push({ courseId, qty });
      }

      await user.save();
      res.json({ message: "Item added to cart", user });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error adding item to cart" });
  }
});

// API
app.get("/", (req, res) => {
    res.send("Serveur démarré");
});
//api inscription
app.post("/Inscription", async (req, res) => {
    console.log(req.body);
    const { email } = req.body;

    try {
        const result = await userModel.findOne({ email: email });
        console.log(result);
        if (result) {
            res.send({ message: "Email existe déjà", alert: false });
        } else {
            const data = userModel(req.body)
            const save = data.save()
            res.send({ message: "Inscrit avec succès", alert: true });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Error" }); 
    }
});
//api authentification
app.post("/Authentification", async (req, res) => {
  console.log(req.body);
  const { email, password,nom } = req.body;

  try {
    const user = await userModel.findOne({ email: email });

    if (user) {

      if (user.password === password) {
        const dataSend = {
          _id: user._id,
          email: user.email,
          nom: user.nom,
          role: user.role,
          profileImage: user.profileImage,
        };
        console.log(dataSend);

        if (user.role === req.body.role) {
          res.send({ message: "Authentification Valide", alert: true, data: dataSend });
        } else {
          res.send({ message: "Rôle invalide", alert: false });
        }
      } else {
        res.send({ message: "Mot de passe erroné", alert: false });
      }
    } else {
      res.send({ message: "Email erroné", alert: false });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Erreur lors de l'authentification" });
  }
});
//Schema  cours
const schemaCours = mongoose.Schema({
  nomFormateur:String ,
  prenomFormateur:String ,
  emailFormateur:String ,
  titreCours: String ,
  imageCours: String ,
  videosCours: [String] ,
  fichiersCours: [String] ,
  typeCours: String ,
  langueCours: String ,
  niveauCours: String ,
  categorieCours: String ,
  sousCategorieCours: String ,
  prixCours: Number ,
  descriptionCours: String ,
});
//Model cours
const coursModel = mongoose.model("cours", schemaCours);
//api save cours
{/*app.post("/ajouterCours",async( req,res)=>{
  console.log(req.body)
  const data= await coursModel(req.body)
  const datasave=await data.save()
  res.send({message:"Dépot avec succés"})
});*/}

// API pour ajouter un cours
app.post("/ajouterCours", upload.fields([{ name: 'videosCours', maxCount: 10 }, { name: 'fichiersCours', maxCount: 10 }]), async (req, res) => {
  try {
    const data = req.body;
    
    if (req.files['videosCours']) {
      data.videosCours = req.files['videosCours'].map(file => file.path);
    }

    if (req.files['fichiersCours']) {
      data.fichiersCours = req.files['fichiersCours'].map(file => file.path);
    }
    console.log("Trying to save data", req.body);
    const newCours = new coursModel(data);
    await newCours.save();
    
    console.log("Data saved");
    res.send({ message: "Dépot avec succès" });
  } catch (error) {
    console.log("Error caught", error);
    res.status(500).send({ message: "Erreur lors de l'ajout du cours", error: error.message });
}
});

//api lister cours
app.get("/cours",async(req,res)=>{
  const dataCours = await coursModel.find({})
  res.send(dataCours);
})
// start the Express server
app.listen(PORT, () => {
  console.log(`Serveur démaré sur le port: ${PORT}`);
});
