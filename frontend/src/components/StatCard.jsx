export default function StatCard({
  title,
  amount,
  change,
  icon: Icon,
  color
}) {
  return (
    <div className="bg-[#101827] border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition">

      <div className="flex justify-between items-center">

        <div>
          <p className="text-sm text-slate-400">
            {title}
          </p>

          <h3 className="text-2xl font-bold text-white mt-3">
            {amount}
          </h3>
        </div>

        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} />
        </div>

      </div>

      <p className="text-sm text-green-400 mt-4">
        {change}
      </p>

    </div>
  );
}
