import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create demo user
    const passwordHash = await bcrypt.hash('password123', 10);
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, currency, theme)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      ['demo@example.com', passwordHash, 'Demo User', 'USD', 'light']
    );
    const userId = userResult.rows[0].id;
    
    // Create categories
    const categories = [
      { name: 'Food & Dining', icon: '🍔', color: '#FF6B6B', type: 'expense' },
      { name: 'Shopping', icon: '🛍️', color: '#4ECDC4', type: 'expense' },
      { name: 'Transportation', icon: '🚗', color: '#45B7D1', type: 'expense' },
      { name: 'Bills & Utilities', icon: '💡', color: '#FFA07A', type: 'expense' },
      { name: 'Entertainment', icon: '🎬', color: '#98D8C8', type: 'expense' },
      { name: 'Healthcare', icon: '🏥', color: '#F7DC6F', type: 'expense' },
      { name: 'Salary', icon: '💰', color: '#52BE80', type: 'income' },
      { name: 'Freelance', icon: '💼', color: '#5DADE2', type: 'income' },
      { name: 'Investment', icon: '📈', color: '#58D68D', type: 'income' },
    ];
    
    const categoryIds = {};
    for (const cat of categories) {
      const result = await client.query(
        `INSERT INTO categories (user_id, name, icon, color, type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, cat.name, cat.icon, cat.color, cat.type]
      );
      categoryIds[cat.name] = result.rows[0].id;
    }
    
    // Create wallets
    const wallets = [
      { name: 'Main Bank Account', type: 'bank', balance: 5000 },
      { name: 'Cash', type: 'cash', balance: 500 },
      { name: 'Credit Card', type: 'credit', balance: -1200 },
    ];
    
    const walletIds = {};
    for (const wallet of wallets) {
      const result = await client.query(
        `INSERT INTO wallets (user_id, name, type, balance, currency)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [userId, wallet.name, wallet.type, wallet.balance, 'USD']
      );
      walletIds[wallet.name] = result.rows[0].id;
    }
    
    // Create sample transactions
    const transactions = [
      { amount: 45.50, type: 'expense', description: 'Grocery shopping', category: 'Food & Dining', wallet: 'Main Bank Account', date: '2026-01-15' },
      { amount: 120.00, type: 'expense', description: 'Gas station', category: 'Transportation', wallet: 'Credit Card', date: '2026-01-16' },
      { amount: 2500.00, type: 'income', description: 'Monthly salary', category: 'Salary', wallet: 'Main Bank Account', date: '2026-01-01' },
      { amount: 89.99, type: 'expense', description: 'Netflix subscription', category: 'Entertainment', wallet: 'Main Bank Account', date: '2026-01-10' },
      { amount: 150.00, type: 'expense', description: 'Electricity bill', category: 'Bills & Utilities', wallet: 'Main Bank Account', date: '2026-01-12' },
      { amount: 75.00, type: 'expense', description: 'Restaurant dinner', category: 'Food & Dining', wallet: 'Credit Card', date: '2026-01-18' },
      { amount: 300.00, type: 'expense', description: 'New shoes', category: 'Shopping', wallet: 'Main Bank Account', date: '2026-01-20' },
      { amount: 500.00, type: 'income', description: 'Freelance project', category: 'Freelance', wallet: 'Main Bank Account', date: '2026-01-22' },
    ];
    
    for (const tx of transactions) {
      await client.query(
        `INSERT INTO transactions (user_id, wallet_id, category_id, amount, type, description, date)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          walletIds[tx.wallet],
          categoryIds[tx.category],
          tx.amount,
          tx.type,
          tx.description,
          tx.date
        ]
      );
    }
    
    // Create savings goals
    await client.query(
      `INSERT INTO savings_goals (user_id, name, target_amount, current_amount, target_date, description)
       VALUES 
       ($1, 'Emergency Fund', 10000, 3500, '2026-12-31', 'Build emergency fund for unexpected expenses'),
       ($1, 'Vacation to Europe', 5000, 1200, '2026-08-01', 'Save for summer vacation')`,
      [userId]
    );
    
    // Create debt
    await client.query(
      `INSERT INTO debts (user_id, name, total_amount, remaining_amount, interest_rate, due_date, description)
       VALUES ($1, 'Student Loan', 15000, 12000, 4.5, '2028-06-01', 'Federal student loan')`,
      [userId]
    );
    
    // Create budget alerts
    await client.query(
      `INSERT INTO budget_alerts (user_id, category_id, monthly_limit, threshold_percentage)
       VALUES 
       ($1, $2, 500, 80),
       ($1, $3, 300, 80)`,
      [userId, categoryIds['Food & Dining'], categoryIds['Transportation']]
    );
    
    await client.query('COMMIT');
    console.log('✅ Seed data created successfully!');
    console.log('📧 Demo user: demo@example.com');
    console.log('🔑 Password: password123');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
