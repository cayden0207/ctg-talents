# **CTG Talents Hub \- 产品需求文档 (PRD)**

**项目名称:** CTG Talents Hub (Centralized Talent Growth & Management System)

**版本:** v1.0

**文档类型:** Web App 开发规范

**核心目标:** 实现集团总部 (HQ) 对合资公司 (JV) 人才的“招募-分发-追踪-管理”全生命周期闭环。

## **1\. 项目背景与痛点 (Context)**

当前部门负责为多家合资公司 (JV) 招募人才，但流程止步于“人员分发”。

* **痛点 A:** 分发后数据断层，无法追踪候选人入职后的状态（Status）。  
* **痛点 B:** 缺乏统一的绩效反馈渠道，HQ 难以评估人才质量。  
* **痛点 C:** 数据分散，缺乏中心化的 Dashboard 来监控全盘人力资源分布。

## **2\. 用户角色 (User Roles)**

### **2.1 总部管理员 (HQ Admin)**

* **权限:** 超级管理员。  
* **职责:** 录入人才、进行面试筛选、将人才分配给特定 JV、查看全局数据、配置系统标准。

### **2.2 合资公司负责人 (JV Partner)**

* **权限:** 受限视图（仅能看到分配给自己公司的人才）。  
* **职责:** 接收/拒绝 HQ 推荐的人才、更新员工在职状态 (Status)、定期填写绩效评价 (Performance)。

## **3\. 核心业务流程 (User Journey)**

1. **招募与筛选 (HQ):** HQ 创建候选人档案 \-\> 面试 \-\> 标记为“待分配 (Ready for Allocation)”。  
2. **分发与握手 (Allocation & Handshake):** HQ 发起推荐 \-\> JV 收到通知 \-\> JV 点击“接收 (Accept)”或“退回 (Reject)”。  
3. **在职管理 (JV):** 人才正式进入 JV 列表 \-\> JV 定期更新状态 (试用/转正/PIP) 及绩效。  
4. **离职与回流 (Offboarding):** 员工离职 \-\> JV 标记离职原因 \-\> (可选) 推荐回流至 HQ 人才池。

## **4\. 功能模块详解 (Functional Requirements)**

### **模块一：身份验证与权限 (Auth & RBAC)**

* **登录/登出:** 支持邮箱/密码登录。  
* **多租户隔离:** JV A 的账号**严禁**看到 JV B 的数据。  
* **角色管理:** 系统预设 Super Admin (HQ) 和 Company Manager (JV) 两种角色。

### **模块二：总部控制台 (HQ Command Center)**

#### **2.1 全局人才池 (Global Talent Pool)**

* **列表视图:** 显示所有人才，支持按“状态”、“所在公司”、“职能”筛选。  
* **新增人才:** 表单录入（姓名、简历附件、联系方式、面试评语、期望薪资）。  
* **分配操作 (The Allocation Logic):**  
  * 选中人才 \-\> 点击“分配 (Allocate)” \-\> 选择目标 JV \-\> 填写推荐备注。  
  * 此时人才状态变为 Pending Acceptance。

#### **2.2 数据仪表盘 (Master Dashboard)**

* **统计图表:**  
  * 各 JV 在职人数分布 (Pie Chart)。  
  * 招聘转化漏斗 (Recruitment Funnel)。  
  * 近期状态异常预警 (例如：超过 3 个月未更新状态的名单)。

### **模块三：合资公司门户 (JV Partner Portal)**

#### **3.1 待处理任务 (Inbox)**

* **新推荐提醒:** 显示 HQ 推送过来的候选人卡片。  
* **操作:**  
  * Accept: 接受候选人，系统提示输入“预计入职日期”。  
  * Reject: 退回候选人，**必须**填写退回理由（如：定薪过高、技能不符）。

#### **3.2 我的团队 (My Team Dashboard)**

* **员工列表:** 仅显示目前归属该 JV 的员工。  
* **状态更新 (Status Manager):**  
  * 下拉菜单快速修改状态：Probation (试用期) \-\> Confirmed (转正) \-\> Resigned (离职)。  
* **绩效打分 (Performance Review):**  
  * 极简入口：点击员工 \-\> 添加 Review。  
  * 字段：日期、评分 (1-5星)、简评 (Text)、是否需要 HQ 介入 (Yes/No)。

### **模块四：通知系统 (Notifications)**

* **邮件/系统内通知:**  
  * 当 HQ 分配人才时 \-\> 通知 JV。  
  * 当 JV 拒绝人才时 \-\> 通知 HQ。  
  * 当 JV 标记员工为“离职”时 \-\> 高亮通知 HQ。

## **5\. 数据字典与状态机 (Data Structure & State Machine)**

### **5.1 核心对象：Candidate (人才)**

| 字段名 | 类型 | 说明 |
| :---- | :---- | :---- |
| id | UUID | 唯一标识符 |
| name | String | 姓名 |
| resume\_url | URL | 简历文件地址 |
| current\_jv\_id | Foreign Key | 当前所在的合资公司 (为空则代表在 HQ 池) |
| status | Enum | **关键状态字段** (见 5.2) |
| interview\_notes | Text | HQ 面试记录 |
| tags | Array | 技能标签 (e.g., Marketing, Sales) |

### **5.2 状态流转逻辑 (Status Workflow)**

这是系统的核心逻辑，开发需严格遵守：

1. **POOL (HQ域):**  
   * New: 新简历入库  
   * Interviewing: HQ 面试中  
   * Ready: 面试通过，等待分配  
2. **TRANSIT (中转域):**  
   * Pending Acceptance: HQ 已推送，等待 JV 确认  
3. **ACTIVE (JV域):**  
   * Onboarding: JV 已接收，办理入职中  
   * Probation: 试用期  
   * Confirmed: 正式员工  
   * PIP: 绩效改进计划 (Performance Improvement Plan)  
4. **END (终局):**  
   * Resigned: 离职 (存档)  
   * Terminated: 辞退  
   * Returned: 回流至 HQ Pool

## **6\. 非功能性需求 (Non-functional Requirements)**

* **数据隐私:** 简历和薪资数据必须加密存储，仅授权人员可见。  
* **移动端适配:** JV 的 Dashboard 必须适配手机浏览器（JV 负责人可能经常出差，需在手机上快速点选状态）。  
* **操作日志 (Audit Log):** 记录谁在什么时间修改了某个人的状态（防止扯皮）。

## **7\. 建议技术栈 (Tech Stack Recommendation)**

* **Frontend:** React.js 或 Vue.js (建议使用 Ant Design Pro 或 Material UI 快速搭建后台模板)。  
* **Backend:** Node.js (NestJS) 或 Python (Django/FastAPI)。  
* **Database:** PostgreSQL (关系型数据库，适合处理结构化的人事数据)。  
* **Hosting:** AWS / Azure / Aliyun (使用 Docker 容器化部署)。

## **8\. 开发阶段规划 (Phasing)**

* **Phase 1 (MVP):** 完成 HQ 录入、分配功能，JV 接收功能，基础状态更新。  
* **Phase 2:** 加入绩效 (Performance) 模块和数据仪表盘 (Charts)。  
* **Phase 3:** 加入人才回流机制和自动化邮件提醒。