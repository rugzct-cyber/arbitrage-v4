try {
    const base = require('./src/adapters/base.adapter');
    console.log("✅ Successfully imported base.adapter");
    console.log("Name:", base.name);
} catch (e) {
    console.error("❌ Failed to import base.adapter:", e.message);
}

try {
    const ostium = require('./src/adapters/ostium');
    console.log("✅ Successfully imported ostium");
} catch (e) {
    console.error("❌ Failed to import ostium:", e.message);
    console.error(e.stack);
}
