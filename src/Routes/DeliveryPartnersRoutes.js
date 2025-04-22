import express from "express";

const DeliveryAgentRoute = express.Router();

import {
    CREATE_PROFILE,
} from "../DeliveryPartners/DeliveryControllers.js"

// DeliveryPartnersRoute.get("/auth", LOG_IN_DELIVERY_PARTNERS);
// DeliveryPartnersRoute.get("/logout", LOG_OUT_DLVRY_PARTNERS);

// DeliveryAgentRoute.post('/register');

DeliveryAgentRoute.post("/profile", CREATE_PROFILE);


export default DeliveryAgentRoute