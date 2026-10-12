import Client from '../models/Client.js';

// Get all clients
export const getClients = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = {};

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    const clients = await Client.find(query).sort({ totalVisits: -1, createdAt: -1 });
    res.json({ success: true, count: clients.length, clients });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new client
export const createClient = async (req, res) => {
  try {
    const { name, category, contactPerson, phone, email, address, tier } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Client name and address are required' });
    }

    const client = await Client.create({
      name,
      category: category || 'Healthcare',
      contactPerson: contactPerson || 'Site Manager',
      phone: phone || '+91 98000 00000',
      email: email || 'client@example.com',
      address,
      tier: tier || 'Enterprise'
    });

    res.status(201).json({ success: true, message: 'Client created successfully', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findOneAndUpdate(
      { $or: [{ _id: id }, { clientId: id }] },
      req.body,
      { new: true, runValidators: true }
    );

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.json({ success: true, message: 'Client updated', client });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findOneAndDelete({ $or: [{ _id: id }, { clientId: id }] });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    res.json({ success: true, message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
