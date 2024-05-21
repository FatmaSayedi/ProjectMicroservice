const Order = require('./Order'); 
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { sendClientMessage } = require('./OrderProducer'); 


const orderProtoPath = './order.proto';
const packageDefinition = protoLoader.loadSync(orderProtoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});
const orderProto = grpc.loadPackageDefinition(packageDefinition).order;


const grpcClient = new orderProto.OrderService('localhost:50052', grpc.credentials.createInsecure());


exports.createOrder = async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        
        
        sendClientMessage(JSON.stringify(savedOrder));

        grpcClient.processOrder(savedOrder, (error, response) => {
            if (error) {
                return res.status(500).json({ message: 'Erreur gRPC', error });
            }
            res.status(201).json({ savedOrder, grpcResponse: response });
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Récupération de toutes les commandes
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Récupération d'une commande par ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order == null) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mise à jour d'une commande par ID
exports.updateOrderById = async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (updatedOrder == null) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
    
        sendClientMessage(JSON.stringify(updatedOrder));

        res.status(200).json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Suppression d'une commande par ID
exports.deleteOrderById = async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (deletedOrder == null) {
            return res.status(404).json({ message: 'Commande non trouvée' });
        }
        

        sendClientMessage(JSON.stringify({ id: req.params.id, action: 'delete' }));

        res.status(200).json({ message: 'Commande supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
