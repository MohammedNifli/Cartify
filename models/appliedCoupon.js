const mongoose = require('mongoose');

const appliedCouponSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }
});

const AppliedCoupon = mongoose.model('AppliedCoupon', appliedCouponSchema);

module.exports = AppliedCoupon;
