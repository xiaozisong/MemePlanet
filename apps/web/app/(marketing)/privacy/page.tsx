/* eslint-disable react/no-unescaped-entities */

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <h1 className="mb-2 text-3xl font-bold">隐私政策 v0.1</h1>
      <p className="mb-8 text-sm text-gray-400">
        最后更新：2026-07-16 · 适用产品：梗星球（MemeChatAI）
      </p>

      <p className="border-brand mb-8 border-l-4 py-2 pl-4 text-gray-400">
        本隐私政策草案基于常用法务模板 + 项目特有 AI 生成内容条款定制。
        <strong className="text-white">正式上线前必须经专业法务/合规评审</strong>。
      </p>

      <h2>一、引言</h2>
      <p>
        梗星球（以下简称"我们"或"平台"）深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。
        我们致力于维持您对我们的信任，恪守以下原则：权责一致原则、目的明确原则、选择同意原则、最少够用原则、确保安全原则、主体参与原则、公开透明原则等。
        同时，我们承诺将按业界成熟的安全标准，采取相应的安全保护措施来保护您的个人信息。
      </p>
      <p>
        <strong>请在使用我们的产品（或服务）前，仔细阅读并了解本《隐私政策》。</strong>
      </p>

      <h2>二、我们如何收集和使用您的个人信息</h2>

      <h3>2.1 注册与登录</h3>
      <table>
        <thead>
          <tr>
            <th>信息类型</th>
            <th>收集目的</th>
            <th>法律依据</th>
            <th>是否强制</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>手机号码</td>
            <td>账号注册、登录验证、短信通知</td>
            <td>履行合同所必需</td>
            <td>是（不提供则无法注册）</td>
          </tr>
          <tr>
            <td>短信验证码</td>
            <td>验证手机号归属</td>
            <td>履行合同所必需</td>
            <td>是（登录时临时收集）</td>
          </tr>
          <tr>
            <td>设备信息（设备型号、操作系统版本）</td>
            <td>保障账号安全、适配显示</td>
            <td>合法利益</td>
            <td>是（自动收集）</td>
          </tr>
        </tbody>
      </table>

      <h3>2.2 梗卡创作与发布</h3>
      <p>当您使用 AI 造梗功能时，我们会收集：</p>
      <ul>
        <li>
          <strong>输入内容</strong>：您输入的梗关键词、主题、选择的模板
        </li>
        <li>
          <strong>生成内容</strong>：AI 基于您的输入生成的梗文本、图片、视频
        </li>
        <li>
          <strong>提交内容</strong>：您选择发布的梗卡（标题、正文、标签、配图/视频）
        </li>
      </ul>
      <p>
        <strong>用途</strong>：为您提供 AI 生成服务、内容发布、内容审核、平台展示。
      </p>

      <h3>2.3 评分与评论</h3>
      <ul>
        <li>您对梗卡的评分（1-5 星）和评论内容</li>
        <li>您的神梗/烂梗判定</li>
      </ul>
      <p>
        <strong>用途</strong>：计算梗卡综合分、展示社区反馈、推荐排序。
      </p>

      <h3>2.4 互动与社交</h3>
      <ul>
        <li>您关注的用户、加入的军团</li>
        <li>您参与的 PK 投票</li>
        <li>您发送的私聊和群聊消息</li>
      </ul>

      <h3>2.5 设备权限申请</h3>
      <table>
        <thead>
          <tr>
            <th>权限</th>
            <th>用途</th>
            <th>是否可关闭</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>网络权限</td>
            <td>数据通信</td>
            <td>否（关闭后无法使用）</td>
          </tr>
          <tr>
            <td>存储权限</td>
            <td>缓存图片/视频</td>
            <td>是</td>
          </tr>
          <tr>
            <td>相机权限</td>
            <td>拍照上传头像（M2 功能）</td>
            <td>是</td>
          </tr>
          <tr>
            <td>通知权限</td>
            <td>推送通知</td>
            <td>是</td>
          </tr>
          <tr>
            <td>麦克风权限</td>
            <td>录制视频配音（M2 功能）</td>
            <td>是</td>
          </tr>
        </tbody>
      </table>

      <h3>2.6 自动收集的信息</h3>
      <ul>
        <li>
          <strong>设备信息</strong>：设备型号、操作系统版本、唯一设备标识符
        </li>
        <li>
          <strong>日志信息</strong>：IP 地址、访问时间、操作记录、崩溃日志
        </li>
        <li>
          <strong>使用数据</strong>：页面浏览、功能使用频率、停留时长
        </li>
      </ul>

      <h2>三、我们如何使用 Cookie 和同类技术</h2>
      <p>我们使用本地存储（AsyncStorage / SecureStore）来：</p>
      <ul>
        <li>保持您的登录状态（JWT Token）</li>
        <li>缓存您的偏好设置</li>
        <li>存储埋点事件队列（待网络恢复后上报）</li>
      </ul>

      <h2>四、我们如何共享、转让、公开披露您的个人信息</h2>

      <h3>4.1 共享</h3>
      <p>我们不会向第三方共享您的个人信息，以下情况除外：</p>
      <table>
        <thead>
          <tr>
            <th>共享方</th>
            <th>共享信息</th>
            <th>用途</th>
            <th>保障措施</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DeepSeek / 智谱 AI / SiliconFlow / 火山引擎</td>
            <td>AI 生成请求的输入文本</td>
            <td>提供 AI 生成服务</td>
            <td>仅传输必要内容，不传输个人身份标识</td>
          </tr>
          <tr>
            <td>阿里云内容安全</td>
            <td>梗卡文字内容</td>
            <td>内容审核</td>
            <td>仅审核内容，不关联用户身份</td>
          </tr>
          <tr>
            <td>短信服务商（阿里云/腾讯云）</td>
            <td>手机号码</td>
            <td>发送验证码</td>
            <td>仅用于短信发送</td>
          </tr>
          <tr>
            <td>PostHog（自建/ SaaS）</td>
            <td>匿名化埋点事件</td>
            <td>产品数据分析</td>
            <td>用户 ID 做不可逆哈希</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>我们不会出售您的个人信息。</strong>
      </p>

      <h3>4.2 AI 生成数据使用特别说明</h3>
      <ol>
        <li>
          您使用 AI 造梗时输入的<strong>关键词和模板选择</strong>仅用于当前生成请求，不用于模型训练
        </li>
        <li>
          您发布的<strong>梗卡内容</strong>（标题、正文）会在平台内公开展示
        </li>
        <li>
          梗卡的<strong>评分、评论、热度数据</strong>会用于平台推荐算法
        </li>
        <li>如果您不希望您的梗卡数据被用于推荐系统，可在设置中关闭"个性化推荐"（M2 功能）</li>
      </ol>

      <h3>4.3 转让</h3>
      <p>我们不会将您的个人信息转让给任何公司、组织和个人，但以下情况除外：</p>
      <ul>
        <li>取得您的明确同意</li>
        <li>
          在涉及合并、收购或破产清算时，如涉及到个人信息转让，我们会要求新的持有您个人信息的公司、组织继续受本政策的约束
        </li>
      </ul>

      <h3>4.4 公开披露</h3>
      <p>我们仅会在以下情况下，公开披露您的个人信息：</p>
      <ul>
        <li>获得您明确同意后</li>
        <li>基于法律或政府部门的强制性要求</li>
      </ul>

      <h2>五、我们如何保护您的个人信息</h2>

      <h3>5.1 技术安全措施</h3>
      <ul>
        <li>传输加密：所有 API 通信使用 HTTPS/TLS 加密</li>
        <li>存储加密：敏感数据（Token）使用 SecureStore 加密存储</li>
        <li>访问控制：基于 JWT 的身份验证和 RBAC 权限控制</li>
        <li>日志脱敏：日志中手机号等敏感信息做脱敏处理</li>
        <li>数据库加密：数据库连接使用 TLS，数据文件加密存储</li>
      </ul>

      <h3>5.2 组织安全措施</h3>
      <ul>
        <li>最小权限原则：仅必要人员可访问用户数据</li>
        <li>数据分类管理：个人敏感信息与非敏感信息分离存储</li>
        <li>安全审计：定期审查数据访问日志</li>
      </ul>

      <h3>5.3 安全事件处理</h3>
      <p>如发生个人信息泄露等安全事件，我们会：</p>
      <ol>
        <li>立即启动应急预案，控制影响范围</li>
        <li>在 72 小时内通过站内通知或短信告知您</li>
        <li>向有关监管机构报告</li>
        <li>对事件进行追溯和改进</li>
      </ol>

      <h2>六、您的权利</h2>
      <table>
        <thead>
          <tr>
            <th>权利</th>
            <th>说明</th>
            <th>实现方式</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>访问权</td>
            <td>访问您的个人资料和使用数据</td>
            <td>个人主页 → 设置</td>
          </tr>
          <tr>
            <td>更正权</td>
            <td>修改您的昵称、签名、头像</td>
            <td>个人主页 → 编辑资料</td>
          </tr>
          <tr>
            <td>删除权</td>
            <td>删除您的账号</td>
            <td>设置 → 注销账号</td>
          </tr>
          <tr>
            <td>撤回同意</td>
            <td>关闭非必要权限</td>
            <td>设备设置 → 应用权限</td>
          </tr>
          <tr>
            <td>注销权</td>
            <td>注销您的账号</td>
            <td>设置 → 注销账号（M2 实现）</td>
          </tr>
          <tr>
            <td>投诉权</td>
            <td>向监管机构投诉</td>
            <td>详见 §十二</td>
          </tr>
        </tbody>
      </table>

      <h2>七、我们如何处理未成年人的个人信息</h2>

      <h3>7.1 年龄限制</h3>
      <ul>
        <li>我们鼓励父母或监护人指导未满 18 周岁的未成年人使用本服务</li>
        <li>
          <strong>未满 14 周岁的儿童</strong>不得使用本服务（如发现将立即封禁并删除数据）
        </li>
        <li>
          <strong>14-18 周岁未成年人</strong>需在监护人同意下使用
        </li>
      </ul>

      <h3>7.2 青少年模式</h3>
      <ul>
        <li>开启后每日使用时长限制为 40 分钟</li>
        <li>夜间 22:00 至次日 06:00 无法使用</li>
        <li>禁止发布内容、评分、评论、私信、加入军团、参与 PK</li>
        <li>搜索受限</li>
      </ul>

      <h3>7.3 监护人权利</h3>
      <p>如您是未成年人的监护人，您有权：</p>
      <ul>
        <li>查询未成年人使用记录</li>
        <li>要求删除未成年人的个人信息</li>
        <li>要求关闭青少年模式（需验证监护人身份）</li>
      </ul>

      <h2>八、您的个人信息如何在全球范围内转移</h2>
      <ul>
        <li>
          主数据库部署在<strong>中国大陆境内</strong>的云服务器上
        </li>
        <li>部分 AI 模型 API 调用可能涉及数据传输至模型供应商的国内节点</li>
        <li>所有数据存储和处理均在中国大陆境内完成</li>
        <li>我们不会将您的个人信息传输至境外</li>
      </ul>

      <h2>九、本隐私政策如何更新</h2>
      <p>我们可能会适时对本隐私政策进行修订。当政策发生实质性变更时，我们会通过：</p>
      <ol>
        <li>站内通知的方式告知您</li>
        <li>更新页面顶部"最后更新"日期</li>
        <li>重大变更时重新获取您的同意</li>
      </ol>
      <p>
        <strong>实质性变更包括</strong>：个人信息处理目的、处理方式、共享方等的重大变化。
      </p>

      <h2>十、如何联系我们</h2>
      <table>
        <thead>
          <tr>
            <th>联系渠道</th>
            <th>方式</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>电子邮件</td>
            <td>（待填写：合规联系邮箱）</td>
          </tr>
          <tr>
            <td>在线客服</td>
            <td>App 内 → 设置 → 意见反馈</td>
          </tr>
          <tr>
            <td>邮寄地址</td>
            <td>（待填写）</td>
          </tr>
        </tbody>
      </table>
      <p>
        我们将在 <strong>15 个工作日内</strong>回复您的请求。
      </p>

      <h2>十一、争议解决</h2>
      <p>
        本隐私政策适用中华人民共和国法律。因本政策引起的或与本政策有关的任何争议，双方应友好协商解决；
        协商不成的，任何一方均可向被告住所地有管辖权的人民法院提起诉讼。
      </p>

      <h2>十二、监管与投诉</h2>
      <p>如您对我们的个人信息处理行为有任何投诉或举报，您可以向以下监管机构投诉：</p>
      <ul>
        <li>
          <strong>网信办</strong>：www.12377.cn
        </li>
        <li>
          <strong>工信部</strong>：www.12321.cn
        </li>
      </ul>

      <h2>附录：第三方 SDK 清单</h2>
      <table>
        <thead>
          <tr>
            <th>SDK 名称</th>
            <th>供应商</th>
            <th>收集信息</th>
            <th>用途</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>DeepSeek API</td>
            <td>深度求索</td>
            <td>输入的文本内容</td>
            <td>AI 文本生成</td>
          </tr>
          <tr>
            <td>GLM API</td>
            <td>智谱 AI</td>
            <td>输入的文本内容</td>
            <td>AI 文本生成降级</td>
          </tr>
          <tr>
            <td>SiliconFlow API</td>
            <td>硅基流动</td>
            <td>输入的梗关键词</td>
            <td>AI 图像生成</td>
          </tr>
          <tr>
            <td>火山引擎 TTS</td>
            <td>字节跳动</td>
            <td>合成的语音内容</td>
            <td>语音合成</td>
          </tr>
          <tr>
            <td>豆包/火山方舟 API</td>
            <td>字节跳动</td>
            <td>输入的文本+图片</td>
            <td>AI 视频生成</td>
          </tr>
          <tr>
            <td>阿里云内容安全</td>
            <td>阿里云</td>
            <td>发布的梗卡文字</td>
            <td>内容审核</td>
          </tr>
          <tr>
            <td>阿里云短信</td>
            <td>阿里云</td>
            <td>手机号码</td>
            <td>验证码发送</td>
          </tr>
          <tr>
            <td>Sentry</td>
            <td>Functional Software</td>
            <td>崩溃日志、设备信息</td>
            <td>错误监控</td>
          </tr>
          <tr>
            <td>PostHog</td>
            <td>PostHog Inc.</td>
            <td>匿名化事件数据</td>
            <td>产品分析</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-12 border-t border-gray-700 pt-6 text-sm text-gray-400">
        <p>
          <strong>免责声明</strong>：本文档为基于项目需求的隐私政策草稿，
          <strong>不能替代专业法律意见</strong>。上线前必须经专业法务/合规团队评审。
        </p>
      </div>
    </article>
  );
}
