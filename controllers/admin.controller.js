import User from '../models/user.model.js';
import Provider from '../models/provider.model.js';
import Customer from '../models/customer.model.js';
import Order from '../models/order.model.js';
import Booking from '../models/booking.model.js';
import ServiceCategory from '../models/serviceCategory.model.js';
import PromoCode from '../models/promoCode.model.js';
import ServiceFee from '../models/serviceFee.model.js';

export const updateAdminProfile = async (req, res) => {
    try {
        const adminId = req.user.id;
        const updateData = req.body;

        const updatedAdmin = await User.findByIdAndUpdate(adminId, updateData, { new: true });

        if (!updatedAdmin) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        res.status(200).json(updatedAdmin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const { filter } = req.query;

        let dateFilter = {};

        if (filter) {
            const now = new Date();
            let startDate;

            if (filter === 'day') {
                startDate = new Date(now.setHours(0, 0, 0, 0));
            } else if (filter === 'week') {
                const firstDayOfWeek = now.getDate() - now.getDay();
                startDate = new Date(now.setDate(firstDayOfWeek));
                startDate.setHours(0, 0, 0, 0);
            } else if (filter === 'month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
            }

            if (startDate) {
                dateFilter = { createdAt: { $gte: startDate } };
            }
        }

        const userCount = await User.countDocuments(dateFilter);
        const providerCount = await Provider.countDocuments(dateFilter);
        const customerCount = await Customer.countDocuments(dateFilter);
        const orderCount = await Order.countDocuments(dateFilter);
        const bookingCount = await Booking.countDocuments(dateFilter);

        const revenueMatchStage = { paymentStatus: 'paid', ...dateFilter };

        const revenueData = await Order.aggregate([
            { $match: revenueMatchStage },
            { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(6);

        res.status(200).json({
            userCount,
            providerCount,
            customerCount,
            orderCount,
            bookingCount,
            totalRevenue,
            recentUsers
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const { status, search } = req.query;
        let filter = {};

        // Add status to filter if it is valid
        if (status && ['active', 'suspended', 'blocked'].includes(status)) {
            filter.status = status;
        }

        // Add search to filter if it exists
        if (search) {
            const searchRegex = new RegExp(search, 'i'); // i for case-insensitive
            filter.$or = [
                { firstName: { $regex: searchRegex } },
                { lastName: { $regex: searchRegex } },
                { email: { $regex: searchRegex } },
            ];
        }

        const users = await User.find(filter);
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllProviders = async (req, res) => {
    try {
        const providers = await Provider.find();
        res.status(200).json(providers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const approveProvider = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        provider.isApproved = true;
        await provider.save();
        res.status(200).json({ message: 'Provider approved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Ensure the provided status is valid
        if (!['active', 'suspended', 'blocked'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        user.status = status;
        await user.save();
        res.status(200).json({ message: `User status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyDocument = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        // This is a placeholder for the actual document verification logic
        provider.isDocumentVerified = true;
        await provider.save();
        res.status(200).json({ message: 'Document verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllServiceRequests = async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const assignRequest = async (req, res) => {
    try {
        const { providerId } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        order.provider = providerId;
        await order.save();
        res.status(200).json({ message: 'Request assigned successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateRequestStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        order.status = status;
        await order.save();
        res.status(200).json({ message: 'Request status updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalTransactions = await Order.countDocuments({ paymentStatus: 'paid' });

        const orders = await Order.find({ paymentStatus: 'paid' })
            .populate('customer', 'firstName lastName email') // Populate customer details
            .populate({
                path: 'bookings',
                populate: [
                    { 
                        path: 'provider', 
                        select: 'firstName lastName' // Populate provider details
                    },
                    {
                        path: 'services.service',
                        select: 'serviceName category subcategory' // Populate service details
                    }
                ]
            })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            totalTransactions,
            currentPage: page,
            totalPages: Math.ceil(totalTransactions / limit),
            data: orders
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const initiatePayout = async (req, res) => {
    try {
        // This is a placeholder for the actual payout logic
        res.status(200).json({ message: 'Payout initiated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.status(200).json({ message: 'Transaction deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addServiceCategory = async (req, res) => {
    try {
        const { name, subcategories } = req.body;
        const image = req.file ? req.file.filename : undefined; // Get filename if uploaded

        const newCategory = new ServiceCategory({ name, subcategories, image });
        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateServiceCategory = async (req, res) => {
    try {
        const { name, subcategories } = req.body;
        const image = req.file ? req.file.filename : undefined; // Get filename if uploaded

        const updateData = { name, subcategories };
        if (image) {
            updateData.image = image;
        }

        const updatedCategory = await ServiceCategory.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteServiceCategory = async (req, res) => {
    try {
        await ServiceCategory.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Service category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createPromoCode = async (req, res) => {
    try {
        const { code, discount } = req.body;
        const newPromoCode = new PromoCode({ code, discount });
        await newPromoCode.save();
        res.status(201).json(newPromoCode);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateServiceFee = async (req, res) => {
    try {
        const { fee } = req.body;
        const serviceFee = await ServiceFee.findOneAndUpdate({}, { fee }, { new: true, upsert: true });
        res.status(200).json(serviceFee);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
