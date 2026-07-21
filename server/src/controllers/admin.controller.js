'use strict';

const { supabaseAdmin } = require('../config/supabase');
const orderService = require('../services/order.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * Admin Controller
 * All routes require authenticate + requireAdmin middleware.
 */

/* -------------------------------------------------------
   Dashboard Stats
   ------------------------------------------------------- */

/**
 * GET /api/admin/dashboard/stats
 * Returns aggregated stats for the admin dashboard.
 */
async function getDashboardStats(req, res, next) {
  try {
    // Run queries in parallel
    const [
      usersResult,
      productsResult,
      ordersResult,
      revenueResult,
      lowStockResult,
      pendingOrdersResult,
      recentOrdersResult,
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('grand_total').in('payment_status', ['paid', 'captured']),
      supabaseAdmin.from('inventory').select('*', { count: 'exact', head: true }).lt('available_stock', 5),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).eq('order_status', 'pending'),
      supabaseAdmin
        .from('orders')
        .select('id, order_number, grand_total, order_status, payment_status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Calculate total revenue
    const revenue = (revenueResult.data || []).reduce(
      (sum, o) => sum + (o.grand_total || 0),
      0
    );

    // Enrich recent orders with user emails
    const recentOrders = recentOrdersResult.data || [];
    let enrichedOrders = recentOrders;

    if (recentOrders.length > 0) {
      const userIds = [...new Set(recentOrders.map((o) => o.user_id).filter(Boolean))];
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      const userMap = {};
      (users || []).forEach((u) => { userMap[u.id] = u; });

      enrichedOrders = recentOrders.map((o) => ({
        ...o,
        status: o.order_status,
        total: o.grand_total,
        customer_email: userMap[o.user_id]?.email || '—',
        customer_name: userMap[o.user_id]?.full_name || '—',
      }));
    }

    res.status(200).json({
      success: true,
      data: {
        totalUsers: usersResult.count ?? 0,
        totalProducts: productsResult.count ?? 0,
        totalOrders: ordersResult.count ?? 0,
        revenue,
        lowStockItems: lowStockResult.count ?? 0,
        pendingOrders: pendingOrdersResult.count ?? 0,
        recentOrders: enrichedOrders,
      },
    });
  } catch (err) {
    next(err);
  }
}

/* -------------------------------------------------------
   User / Customer Management
   ------------------------------------------------------- */

/**
 * GET /api/admin/users
 * Returns paginated list of all users.
 * Query: { page, limit, search, role }
 */
async function getUsers(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { search, role } = req.query;

    let query = supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role, created_at', { count: 'exact' });

    if (role) query = query.eq('role', role);
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: data ?? [],
      pagination: buildPaginationMeta(page, limit, count ?? 0),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/users/:id
 * Returns a single user with their order history.
 */
async function getUserById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone, role, created_at')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Fetch user's addresses and recent orders
    const [addrResult, ordersResult] = await Promise.all([
      supabaseAdmin.from('user_addresses').select('*').eq('user_id', id),
      supabaseAdmin
        .from('orders')
        .select('id, order_number, grand_total, order_status, payment_status, created_at')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...user,
        addresses: addrResult.data ?? [],
        orders: (ordersResult.data ?? []).map((o) => ({
          ...o,
          status: o.order_status,
          total: o.grand_total,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/users/:id/role
 * Update a user's role (admin / customer).
 * Body: { role }
 */
async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'customer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'role must be one of: admin, customer',
      });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'User role updated.',
      data,
    });
  } catch (err) {
    next(err);
  }
}

/* -------------------------------------------------------
   Order Management (Admin)
   ------------------------------------------------------- */

/**
 * GET /api/admin/orders
 * Returns all orders with user info (paginated, filterable by status).
 * Query: { page, limit, status }
 */
async function getAllOrders(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { status } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select(`
        id, order_number, grand_total, subtotal, shipping_charge, tax,
        order_status, payment_status, shipment_status, created_at, user_id
      `, { count: 'exact' });

    if (status) query = query.eq('order_status', status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Enrich with user info and items
    const orders = data ?? [];
    let enriched = orders;

    if (orders.length > 0) {
      const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, phone')
        .in('id', userIds);

      const userMap = {};
      (users || []).forEach((u) => { userMap[u.id] = u; });

      // Fetch items for each order
      enriched = await Promise.all(orders.map(async (o) => {
        const { data: items } = await supabaseAdmin
          .from('order_items')
          .select('id, product_name, sku, price, quantity, total')
          .eq('order_id', o.id);
        return {
          ...o,
          status: o.order_status,
          total: o.grand_total,
          user: userMap[o.user_id] || null,
          items: items || [],
        };
      }));
    }

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: buildPaginationMeta(page, limit, count ?? 0),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders/:id
 * Returns a single order (admin view, full details).
 */
async function getAdminOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      throw error;
    }

    // Fetch items separately
    const { data: items } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', id);

    // Fetch address separately
    let address = null;
    if (order.address_id) {
      const { data: addr } = await supabaseAdmin
        .from('user_addresses')
        .select('id, full_name, phone, address_line_1, address_line_2, city, state, country, postal_code, landmark')
        .eq('id', order.address_id)
        .single();
      address = addr || null;
    }

    // Fetch user info
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, phone')
      .eq('id', order.user_id)
      .single();

    // Fetch payment info
    const { data: payment } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fetch shipment info
    const { data: shipment } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('order_id', id)
      .single();

    res.status(200).json({
      success: true,
      data: {
        ...order,
        status: order.order_status,
        total: order.grand_total,
        items: items || [],
        address,
        user: user || null,
        payment: payment || null,
        shipment: shipment || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status (order_status, payment_status, or shipment_status).
 * Body: { status } — updates order_status
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, payment_status, shipment_status, notes } = req.body;

    const updates = {};
    if (status) updates.order_status = status;
    if (payment_status) updates.payment_status = payment_status;
    if (shipment_status) updates.shipment_status = shipment_status;
    if (notes !== undefined) updates.notes = notes;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid status field provided.',
      });
    }

    const order = await orderService.updateOrder(id, updates);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      data: { ...order, status: order.order_status },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserRole,
  getAllOrders,
  getAdminOrderById,
  updateOrderStatus,
};
