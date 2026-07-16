'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTtl, setSentTtl] = useState<number | null>(null);

  async function sendCode() {
    setError(null);
    if (!/^1\d{10}$/.test(phone)) {
      setError('请输入有效的 11 位手机号');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? '验证码发送失败');
        return;
      }
      setSentTtl(data.ttlSec ?? 60);
      setStep('code');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndLogin() {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError('请输入 6 位验证码');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? '登录失败');
        return;
      }
      // 持久化 token
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user_id', data.userId);
      // 校验是否是 admin 角色（拉 me）
      const meRes = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      if (meRes.ok) {
        const me = await meRes.json();
        if (me.role !== 'admin' && me.role !== 'super_admin') {
          setError('该账号无运营后台权限');
          localStorage.removeItem('admin_token');
          return;
        }
      }
      router.push('/admin');
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-ink flex min-h-screen items-center justify-center text-white">
      <form
        className="bg-ink-soft w-96 rounded-xl p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 'phone') {
            sendCode();
          } else {
            verifyAndLogin();
          }
        }}
      >
        <h1 className="mb-2 text-2xl font-bold">运营后台登录</h1>
        <p className="mb-6 text-sm text-gray-400">仅 admin / super_admin 角色可登录</p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </div>
        )}

        <label className="mb-2 block text-sm text-gray-400">手机号</label>
        <input
          className="bg-ink mb-4 w-full rounded px-4 py-2 outline-none"
          placeholder="11 位手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={step === 'code'}
          inputMode="numeric"
          maxLength={11}
        />

        {step === 'code' && (
          <>
            <label className="mb-2 block text-sm text-gray-400">
              验证码{sentTtl ? `（${sentTtl}s 内有效）` : ''}
            </label>
            <input
              className="bg-ink mb-4 w-full rounded px-4 py-2 outline-none"
              placeholder="6 位验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              maxLength={6}
            />
          </>
        )}

        <button
          className="bg-brand hover:bg-brand-dark w-full rounded py-2 font-semibold disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '处理中...' : step === 'phone' ? '发送验证码' : '登录'}
        </button>
        {step === 'code' && (
          <button
            type="button"
            className="mt-3 w-full text-center text-sm text-gray-400 hover:text-white"
            onClick={() => {
              setStep('phone');
              setCode('');
              setSentTtl(null);
            }}
          >
            ← 返回修改手机号
          </button>
        )}

        <p className="mt-6 text-xs text-gray-500">
          登录后 token 存于 localStorage，由各 Admin 子页在请求时附加 Authorization 头。
        </p>
      </form>
    </div>
  );
}
