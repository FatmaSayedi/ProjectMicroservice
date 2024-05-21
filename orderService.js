const mongoose = require('mongoose');
const Order = require('./Order');

mongoose.connect('mongodb://localhost:27017/shop', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB for orders'))
    .catch(err => console.error('Error connecting to MongoDB for orders:', err));

async function getAllOrders() {
    try {
        const orders = await Order.find().populate('products');
        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        throw error;
    }
}

module.exports = {
    getAllOrders,
};
