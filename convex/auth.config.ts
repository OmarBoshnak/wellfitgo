export default {
    providers: [
        {
            // Clerk JWT template issuer URL
            // You need to create a "convex" JWT template in Clerk Dashboard
            // and copy the Issuer URL here (or set it as an env variable)
            domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
            applicationID: "convex",
        },
    ],
};
