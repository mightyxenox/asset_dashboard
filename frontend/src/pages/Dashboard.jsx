import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { fetchWithAuth } from '../utils';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#d0ed57'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { wallets, coins } = useData();
  const [groupBy, setGroupBy] = useState('wallet');
  const [walletFilter, setWalletFilter] = useState('');
  const [coinFilter, setCoinFilter] = useState('');
  const [username, setUsername] = useState('User');
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatPnl = (value) => {
    const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
    return <span className={color}>${value}</span>;
  };

  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      navigate('/');
    } else {
      console.error(err);
      setError('Failed to load dashboard.');
    }
  };

  const fetchUsername = () => {
    try {
      const token = localStorage.getItem('token');
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUsername(payload.username);
    } catch (err) {
      console.error('Error decoding token:', err);
    }
  };

  const fetchDashboard = async () => {
    try {
      let url = `/api/dashboard?group_by=${groupBy}`;
      if (walletFilter) url += `&wallet=${walletFilter}`;
      if (coinFilter) url += `&coin=${coinFilter}`;
      const res = await fetchWithAuth(url);
      setDashboardData(res.data || {});
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsername();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // 30 seconds minimum
    return () => clearInterval(interval);
  }, [groupBy, walletFilter, coinFilter]);

  const { overall, ...groups } = dashboardData || {};
  const pieData = Object.entries(groups).map(([key, val]) => ({
    name: key,
    value: val.total_invested,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-60"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 font-semibold">
        {error}{' '}
        <button className="underline ml-2 text-blue-600" onClick={() => navigate('/')}>
          Login again
        </button>
      </div>
    );
  }

  const isEmpty = !dashboardData || Object.keys(groups).length === 0;
  
  const getEmptyMessage = () => {
    if (walletFilter && coinFilter) {
      return `No data found for ${coinFilter} in ${walletFilter}. This coin may not exist in this wallet.`;
    } else if (coinFilter) {
      return `No data found for coin: ${coinFilter}. You may not own this coin.`;
    } else if (walletFilter) {
      return `No data found for wallet: ${walletFilter}. Buy some coins to get started!`;
    }
    return 'No assets found. Buy some coins to get started!';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Hello {username}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/buy-sell')}
            className="px-4 py-2 bg-blue-600 text-white rounded-full shadow hover:bg-blue-700"
          >
            Go to Buy/Sell
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              navigate('/');
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-full shadow hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>


      {isEmpty ? (
        <div className="text-center text-gray-500 mt-10 text-lg">
          {getEmptyMessage()}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2 capitalize">{groupBy} wise Investment</h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-4">
              <h2 className="text-xl font-semibold mb-2">Overall P&L</h2>
              <p>Total Qty: {overall.total_qty}</p>
              <p>Total Invested: ${overall.total_invested}</p>
              <p>Realised P&L: {formatPnl(overall.realised_pnl || 0)}</p>
              <p>Unrealised P&L: {formatPnl(overall.unrealised_pnl || 0)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <label>
              Group By:{' '}
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="wallet">Wallet</option>
                <option value="coin">Coin</option>
              </select>
            </label>

            <label>
              Filter by Wallet:{' '}
              <select
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">All</option>
                {wallets.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Filter by Coin:{' '}
              <select
                value={coinFilter}
                onChange={(e) => setCoinFilter(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">All</option>
                {coins.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="space-y-4">
            {Object.entries(groups).map(([group, groupData]) => {
              const nested = groupData[groupBy === 'wallet' ? 'coins' : 'wallets'] || {};
              return (
                <details key={group} className="bg-white rounded-2xl shadow-md p-4">
                  <summary className="cursor-pointer font-semibold text-lg">
                    {group} - Qty: {groupData.total_qty}, Invested: ${groupData.total_invested},
                    Unrealised P&L: {formatPnl(groupData.unrealised_pnl || 0)}
                  </summary>
                  <div className="mt-2 pl-4 space-y-1">
                    {Object.entries(nested).map(([name, info]) => (
                      <div key={name} className="border-b py-1">
                        <p className="font-medium">{name}</p>
                        <p>Qty: {info.qty}, Invested: ${info.total_invested}</p>
                        <p>Realised P&L: {formatPnl(info.realised_pnl || 0)}</p>
                        <p>Unrealised P&L: {formatPnl(info.unrealised_pnl || 0)}</p>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
