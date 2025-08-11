const { clients, pendingRequests, generateRequestId } = require('../ws/websocket');

const REQUEST_TIMEOUT = 60000; // 1 minute

const handleApiCall = (req, res) => {
    const { id, apiname, apiparams } = req.body;

    console.log(req.headers, req.body);

    if (!id || !apiname) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const ws = clients.get(id);
    if (!ws) {
        return res.status(404).json({ error: 'Client not connected' });
    }

    const requestId = generateRequestId();
    pendingRequests.set(requestId, res);

    try {
        ws.send(
            JSON.stringify({
                type: 'api_call',
                requestId,
                apiname,
                apiparams
            })
        );
    } catch (err) {
        pendingRequests.delete(requestId);
        return res.status(500).json({ error: 'Failed to send request to client' });
    }

    setTimeout(() => {
        if (pendingRequests.has(requestId)) {
            res.status(504).json({ error: 'Timeout waiting for response' });
            pendingRequests.delete(requestId);
        }
    }, REQUEST_TIMEOUT);
};

module.exports = {
    handleApiCall,
};
