
const url = 'https://storage.googleapis.com/grove-assets/deep-dive-main_1765684129082.wav';

async function check() {
    try {
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`Content-Type: ${response.headers.get('content-type')}`);

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`Total Size: ${buffer.length} bytes`);

        if (buffer.length > 50) {
            console.log('First 50 bytes (Hex):', buffer.subarray(0, 50).toString('hex'));
            console.log('First 50 bytes (Text):', buffer.subarray(0, 50).toString('utf-8')); // Might look like garbage if binary
        } else {
            console.log('Full Content (Text):', buffer.toString('utf-8'));
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

check();
