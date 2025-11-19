/**
 * 品牌展示区组件
 */
import { Brain } from "lucide-react";

export function BrandSection() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      {/* Logo 和标题 */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">智能评审系统</h1>
            <p className="text-blue-100 text-sm mt-1">AI-Powered Review Platform</p>
          </div>
        </div>
      </div>

      {/* 特性展示 */}
      <div className="relative z-10 space-y-8">
        <div className="space-y-6">
          <FeatureItem
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="智能化评审"
            description="基于AI技术的智能评审引擎，提供精准、高效的评审服务"
          />

          <FeatureItem
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
            title="高效协作"
            description="实时协作，流程透明，让团队评审更加顺畅"
          />

          <FeatureItem
            icon={
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            title="数据洞察"
            description="全面的数据分析，助力决策优化"
          />
        </div>
      </div>

      {/* 底部信息 */}
      <div className="relative z-10 text-blue-100 text-sm">
        <p>© 2024 智能评审系统. All rights reserved.</p>
      </div>
    </div>
  );
}

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-blue-100 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
