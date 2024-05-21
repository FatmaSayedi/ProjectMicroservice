const Product = require('./Product'); 
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendClientMessage } = require('./productProducer');


const productProtoPath = './product.proto';
const packageDefinition = protoLoader.loadSync(productProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const productProto = grpc.loadPackageDefinition(packageDefinition).product;


const grpcClient = new productProto.ProductService('localhost:50051', grpc.credentials.createInsecure());

// ajout d'un nouveau produit
exports.createProduct = async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        
        
        sendClientMessage(JSON.stringify(savedProduct));

        
        grpcClient.addProduct(savedProduct, (error, response) => {
            if (error) {
                return res.status(500).json({ message: 'Erreur gRPC', error });
            }
            res.status(201).json({ savedProduct, grpcResponse: response });
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Récupération de tous les produits
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupération d'un produit par ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product == null) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mise à jour d'un produit par ID
exports.updateProductById = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (updatedProduct == null) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        
        // Envoyer un message à Kafka
        sendClientMessage(JSON.stringify(updatedProduct));

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Suppression d'un produit par ID
exports.deleteProductById = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (deletedProduct == null) {
            return res.status(404).json({ message: 'Produit non trouvé' });
        }
        
      
        sendClientMessage(JSON.stringify({ id: req.params.id, action: 'delete' }));

        res.status(200).json({ message: 'Produit supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
