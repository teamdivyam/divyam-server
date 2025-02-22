import Counter from "./CounterModel.js";
// collectionName  {orderID, }
// preText DVYM || ORDERID_ || 

async function generateOrderID(collectionName, preText) {

    const counter = await Counter.findOneAndUpdate(
        { name: collectionName },
        { $inc: { count: 1 } },
        { new: true, upsert: true }
    );

    return `${preText}${counter.count}`;
}


export default generateOrderID