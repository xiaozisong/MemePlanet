'use client';

import { useEffect, useState } from 'react';
import { fetchUsers, banUser, type UserInfo } from '@/lib/admin-api';

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [banning, setBanning] = useState<string | null>(null);

  function load(p: number) {
    setLoading(true);
    fetchUsers(p)
      .then((r) => {
        setUsers(r.list);
        setTotal(r.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => load(page), [page]);

  async function handleBan(userId: string) {
    const reason = prompt('封禁原因：');
    if (!reason) return;
    setBanning(userId);
    try {
      await banUser(userId, reason);
      load(page);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBanning(null);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">用户管理</h1>
      {loading ? (
        <p className="text-gray-400">加载中...</p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-400">共 {total} 名用户</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-ink-soft border-b text-gray-400">
                  <th className="pb-2 pr-4">昵称</th>
                  <th className="pb-2 pr-4">手机</th>
                  <th className="pb-2 pr-4">角色</th>
                  <th className="pb-2 pr-4">等级</th>
                  <th className="pb-2 pr-4">Pro</th>
                  <th className="pb-2 pr-4">状态</th>
                  <th className="pb-2 pr-4">注册时间</th>
                  <th className="pb-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-ink-soft/50 border-b">
                    <td className="py-3 pr-4">{u.nickname}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{u.phone}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          u.role === 'admin' || u.role === 'super_admin'
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">Lv.{u.level}</td>
                    <td className="py-3 pr-4">{u.isPro ? '✅' : '—'}</td>
                    <td className="py-3 pr-4">{u.status}</td>
                    <td className="py-3 pr-4 text-xs text-gray-500">{formatTime(u.createdAt)}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleBan(u.userId)}
                        disabled={banning === u.userId}
                        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                      >
                        {banning === u.userId ? '处理中...' : '封禁'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="hover:text-white disabled:opacity-50"
            >
              上一页
            </button>
            <span>第 {page} 页</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={users.length < 20}
              className="hover:text-white disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  );
}
