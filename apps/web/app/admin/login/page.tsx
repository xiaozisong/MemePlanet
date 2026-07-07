export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center text-white">
      <form className="bg-ink-soft rounded-xl p-8 w-96">
        <h1 className="text-2xl font-bold mb-6">运营后台登录</h1>
        <input
          className="w-full bg-ink rounded px-4 py-2 mb-4 outline-none"
          placeholder="账号"
        />
        <input
          type="password"
          className="w-full bg-ink rounded px-4 py-2 mb-6 outline-none"
          placeholder="密码"
        />
        <button className="w-full bg-brand rounded py-2 font-semibold">
          登录
        </button>
        <p className="text-gray-400 text-sm mt-4">TODO：M1 S2 接入 JWT + RBAC</p>
      </form>
    </div>
  );
}
