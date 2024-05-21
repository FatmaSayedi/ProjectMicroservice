const express = require('express');
const { getAllOrders } = require('./orderService');

const app = express();

app.get('/orders', async (req, res) => {
    try {
        const orders = await getAllOrders();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

app.listen(3003, () => {
    console.log('Order service is running on port 3003');
});