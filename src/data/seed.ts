import type {
  BorrowRequest,
  Feedback,
  Item,
  TimelineEvent,
  User,
  AppNotification
} from '@/types'
import { isoDate } from '@/utils/date'
import { uid } from '@/utils/id'

const HOUR = 3600 * 1000
const now = Date.now()
const ago = (h: number) => now - h * HOUR

function ev(level: TimelineEvent['level'], actorName: string, text: string, hoursAgo: number): TimelineEvent {
  return { id: uid('e'), at: ago(hoursAgo), level, actorName, text }
}

export const SEED_USERS: User[] = [
  { id: 'u1', name: '王桂兰', role: 'resident', building: '3号楼 201', phone: '138****2201' },
  { id: 'u2', name: '李建国', role: 'resident', building: '5号楼 302', phone: '139****3302' },
  { id: 'u3', name: '陈小雨', role: 'resident', building: '7号楼 101', phone: '137****1101' },
  { id: 'u4', name: '周敏', role: 'resident', building: '2号楼 402', phone: '136****4402' },
  { id: 'u5', name: '赵磊', role: 'resident', building: '9号楼 602', phone: '135****6602' },
  { id: 'v1', name: '林芳', role: 'volunteer', building: '社区志愿者', phone: '131****0001' },
  { id: 'v2', name: '郑涛', role: 'volunteer', building: '社区志愿者', phone: '132****0002' },
  { id: 's1', name: '孙丽', role: 'staff', building: '阳光社区居委会', phone: '130****8001' }
]

export const SEED_ITEMS: Item[] = [
  {
    id: 'it1',
    name: '儿童退热贴（6片装）',
    category: 'cooling_patch',
    spec: '4cm×11cm，6片/盒',
    expiryDate: isoDate(210),
    storage: 'cool_dry',
    sealedNew: true,
    quantity: 3,
    availableQty: 2,
    pickupLocation: '3号楼2层“共享药箱”置物柜 A 格（3号楼201门口旁）',
    sharerId: 'u1',
    status: 'published',
    scenarios: ['fever_night'],
    restrictions: '仅物理降温辅助；皮肤破损处勿用；幼儿需在成人看护下使用',
    remarks: '孩子大了用不上，整盒未拆封，留给夜里应急的家庭。',
    createdAt: ago(72),
    publishedAt: ago(70),
    reviewerId: 'v1',
    events: [
      ev('info', '王桂兰', '登记物品：儿童退热贴 3 盒', 72),
      ev('success', '林芳（志愿者）', '审核通过：包装完好、信息齐全，已发布', 70)
    ]
  },
  {
    id: 'it2',
    name: '碘伏消毒棉签（独立包装）',
    category: 'iodophor',
    spec: '8cm 棉签，20支/盒',
    expiryDate: isoDate(15),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 2,
    availableQty: 2,
    pickupLocation: '5号楼一层便民服务台',
    sharerId: 'u2',
    status: 'published',
    scenarios: ['wound_elderly', 'home_care'],
    restrictions: '仅供外用消毒，不可内服；对碘过敏者禁用',
    remarks: '',
    createdAt: ago(120),
    publishedAt: ago(118),
    reviewerId: 'v2',
    events: [
      ev('info', '李建国', '登记物品：碘伏棉签 2 盒', 120),
      ev('success', '郑涛（志愿者）', '审核通过，已发布', 118),
      ev('warning', '系统', '效期提醒：距有效期不足 30 天', 24)
    ]
  },
  {
    id: 'it3',
    name: '无菌纱布块',
    category: 'gauze',
    spec: '7.5cm×7.5cm，5片/袋',
    expiryDate: isoDate(5),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 2,
    availableQty: 1,
    pickupLocation: '3号楼2层“共享药箱”置物柜 A 格',
    sharerId: 'u1',
    status: 'published',
    scenarios: ['wound_elderly', 'home_care'],
    restrictions: '一次性使用；包装破损、超过有效期禁止使用',
    remarks: '',
    createdAt: ago(96),
    publishedAt: ago(94),
    reviewerId: 'v1',
    events: [
      ev('info', '王桂兰', '登记物品：无菌纱布 2 袋', 96),
      ev('success', '林芳（志愿者）', '审核通过，已发布', 94),
      ev('warning', '系统', '效期提醒：距有效期不足 7 天，借出时请重点告知', 12)
    ]
  },
  {
    id: 'it4',
    name: '防水创可贴',
    category: 'band_aid',
    spec: '72mm×22mm，100片/盒',
    expiryDate: isoDate(420),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 1,
    availableQty: 1,
    pickupLocation: '9号楼602门口信报箱（联系后自取）',
    sharerId: 'u5',
    status: 'published',
    scenarios: ['wound_elderly', 'home_care'],
    restrictions: '小伤口临时保护；伤口感染、渗液多时不适用',
    remarks: '',
    createdAt: ago(50),
    publishedAt: ago(48),
    reviewerId: 'v1',
    events: [
      ev('info', '赵磊', '登记物品：防水创可贴 1 盒', 50),
      ev('success', '林芳（志愿者）', '审核通过，已发布', 48)
    ]
  },
  {
    id: 'it5',
    name: '一次性医用外科口罩',
    category: 'mask',
    spec: '成人款，50只/盒',
    expiryDate: isoDate(300),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 2,
    availableQty: 2,
    pickupLocation: '5号楼一层便民服务台',
    sharerId: 'u2',
    status: 'published',
    scenarios: ['mask_emergency'],
    restrictions: '一次性使用，勿重复使用；儿童请选用合适尺码',
    remarks: '富余两盒，给临时急需的邻居。',
    createdAt: ago(60),
    publishedAt: ago(58),
    reviewerId: 'v2',
    events: [
      ev('info', '李建国', '登记物品：医用口罩 2 盒', 60),
      ev('success', '郑涛（志愿者）', '审核通过，已发布', 58)
    ]
  },
  {
    id: 'it6',
    name: '体温计纽扣电池 LR41',
    category: 'thermometer_battery',
    spec: 'LR41 1.55V，2粒/卡',
    expiryDate: isoDate(900),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 4,
    availableQty: 4,
    pickupLocation: '9号楼602门口信报箱',
    sharerId: 'u5',
    status: 'published',
    scenarios: ['fever_night'],
    restrictions: '纽扣电池请远离儿童，防止误食',
    remarks: '',
    createdAt: ago(200),
    publishedAt: ago(198),
    reviewerId: 'v1',
    events: [
      ev('info', '赵磊', '登记物品：LR41 电池 4 卡', 200),
      ev('success', '林芳（志愿者）', '审核通过，已发布', 198)
    ]
  },
  {
    id: 'it7',
    name: '医用透气胶带',
    category: 'medical_tape',
    spec: '1.25cm×9.1m，1卷/袋',
    expiryDate: isoDate(120),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 3,
    availableQty: 3,
    pickupLocation: '3号楼2层“共享药箱”置物柜 A 格',
    sharerId: 'u1',
    status: 'published',
    scenarios: ['home_care', 'wound_elderly'],
    restrictions: '皮肤过敏者慎用，出现瘙痒红疹请停止使用',
    remarks: '',
    createdAt: ago(40),
    publishedAt: ago(38),
    reviewerId: 'v2',
    events: [
      ev('info', '王桂兰', '登记物品：医用胶带 3 卷', 40),
      ev('success', '郑涛（志愿者）', '审核通过，已发布', 38)
    ]
  },
  {
    id: 'it8',
    name: '生理性盐水 100ml（外用冲洗）',
    category: 'saline',
    spec: '100ml/瓶，外用',
    expiryDate: isoDate(-3),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 1,
    availableQty: 1,
    pickupLocation: '2号楼402门口（需电话联系）',
    sharerId: 'u4',
    status: 'published',
    scenarios: ['wound_elderly', 'home_care'],
    restrictions: '仅供外用冲洗；开瓶后 24 小时内用完',
    remarks: '志愿者上门复核时请重点核对效期。',
    createdAt: ago(300),
    publishedAt: ago(298),
    reviewerId: 'v1',
    events: [
      ev('info', '周敏', '登记物品：外用生理盐水 1 瓶', 300),
      ev('success', '林芳（志愿者）', '审核通过，已发布', 298),
      ev('danger', '系统', '效期预警：物品已过有效期，已自动暂停借用，等待社区报废处理', 72)
    ]
  },
  {
    id: 'it9',
    name: '宝宝退热贴（4片装）',
    category: 'cooling_patch',
    spec: '4cm×8cm，4片/盒',
    expiryDate: isoDate(180),
    storage: 'cool_dry',
    sealedNew: true,
    quantity: 1,
    availableQty: 1,
    pickupLocation: '7号楼101门口牛奶箱',
    sharerId: 'u3',
    status: 'pending_review',
    scenarios: ['fever_night'],
    restrictions: '物理降温辅助',
    remarks: '囤多了一盒，希望帮到夜里孩子发烧的家庭。',
    createdAt: ago(3),
    events: [ev('info', '陈小雨', '登记物品，等待志愿者审核', 3)]
  },
  {
    id: 'it10',
    name: '一次性医用检查手套',
    category: 'gloves',
    spec: 'M 码，100只/盒',
    expiryDate: isoDate(260),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 2,
    availableQty: 2,
    pickupLocation: '2号楼402门口',
    sharerId: 'u4',
    status: 'pending_review',
    scenarios: ['home_care', 'mask_emergency'],
    restrictions: '一次性使用',
    remarks: '',
    createdAt: ago(2),
    events: [ev('info', '周敏', '登记物品，等待志愿者审核', 2)]
  },
  {
    id: 'it11',
    name: '儿童尺寸口罩（3-6岁）',
    category: 'mask',
    spec: '14.5cm，10只/袋',
    expiryDate: isoDate(200),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 3,
    availableQty: 0,
    pickupLocation: '3号楼2层“共享药箱”置物柜 A 格',
    sharerId: 'u1',
    status: 'recalled',
    scenarios: ['mask_emergency'],
    restrictions: '一次性使用',
    remarks: '',
    createdAt: ago(80),
    events: [
      ev('info', '王桂兰', '登记物品：儿童口罩 3 袋', 80),
      ev('warning', '王桂兰', '共享人撤回：家中仍需自用，取消共享', 10)
    ]
  },
  {
    id: 'it12',
    name: '一次性医用检查手套（S码）',
    category: 'gloves',
    spec: 'S 码，50只/盒',
    expiryDate: isoDate(350),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 1,
    availableQty: 0,
    pickupLocation: '5号楼一层便民服务台',
    sharerId: 'u2',
    status: 'fully_lent',
    scenarios: ['home_care'],
    restrictions: '一次性使用',
    remarks: '',
    createdAt: ago(66),
    publishedAt: ago(64),
    reviewerId: 'v1',
    events: [
      ev('info', '李建国', '登记物品：检查手套 1 盒', 66),
      ev('success', '林芳（志愿者）', '审核通过，已发布', 64)
    ]
  },
  {
    id: 'it13',
    name: '卡通创可贴（儿童款）',
    category: 'band_aid',
    spec: '58mm×19mm，40片/盒',
    expiryDate: isoDate(330),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 1,
    availableQty: 1,
    pickupLocation: '7号楼101门口牛奶箱',
    sharerId: 'u3',
    status: 'published',
    scenarios: ['wound_elderly'],
    restrictions: '小伤口保护',
    remarks: '',
    createdAt: ago(30),
    publishedAt: ago(28),
    reviewerId: 'v2',
    events: [
      ev('info', '陈小雨', '登记物品：卡通创可贴 1 盒', 30),
      ev('success', '郑涛（志愿者）', '审核通过，已发布', 28)
    ]
  },
  {
    id: 'it14',
    name: '独立包装无菌纱布片',
    category: 'gauze',
    spec: '5cm×5cm，10片/盒',
    expiryDate: isoDate(40),
    storage: 'room_dry',
    sealedNew: true,
    quantity: 1,
    availableQty: 0,
    pickupLocation: '2号楼402门口',
    sharerId: 'u4',
    status: 'scrapped',
    scenarios: ['wound_elderly', 'home_care'],
    restrictions: '一次性使用',
    remarks: '',
    createdAt: ago(150),
    publishedAt: ago(148),
    reviewerId: 'v1',
    scrapReason: '接到疑似不适反应反馈并复核：该批次暂停流转，已回收报废',
    events: [
      ev('info', '周敏', '登记物品：无菌纱布片 1 盒', 150),
      ev('success', '林芳（志愿者）', '审核通过，已发布', 148),
      ev('danger', '陈小雨', '反馈疑似不适反应：使用部位发红发痒', 20),
      ev('danger', '孙丽（社区工作人员）', '社区介入：物品立即下架，剩余部分回收报废并记录', 18)
    ]
  },
  {
    id: 'it15',
    name: '瓶装医用酒精（已开封）',
    category: 'other',
    spec: '100ml/瓶',
    expiryDate: isoDate(300),
    storage: 'room_dry',
    sealedNew: false,
    quantity: 1,
    availableQty: 0,
    pickupLocation: '7号楼101',
    sharerId: 'u3',
    status: 'rejected',
    scenarios: [],
    restrictions: '',
    remarks: '',
    createdAt: ago(20),
    reviewerId: 'v1',
    rejectReason: '物品已拆封，拆封药品和耗材不能进入共享，请使用整盒未开封物品登记',
    events: [
      ev('info', '陈小雨', '登记物品：瓶装酒精', 20),
      ev('danger', '林芳（志愿者）', '审核未通过：物品已拆封，不符合共享准入要求', 19)
    ]
  }
]

export const SEED_REQUESTS: BorrowRequest[] = [
  {
    // 多人同时申请：两个 pending，均未确认
    id: 'r1',
    itemId: 'it5',
    borrowerId: 'u3',
    qty: 1,
    scenario: 'mask_emergency',
    method: 'pickup',
    status: 'pending',
    createdAt: ago(2),
    handoverPhotos: [],
    events: [ev('info', '陈小雨', '提交申请：临时缺口罩 1 盒，选择自取', 2)]
  },
  {
    id: 'r2',
    itemId: 'it5',
    borrowerId: 'u4',
    qty: 1,
    scenario: 'mask_emergency',
    method: 'doorstep',
    status: 'pending',
    createdAt: ago(1),
    handoverPhotos: [],
    events: [ev('info', '周敏', '提交申请：临时缺口罩 1 盒，选择邻居门口无接触交接', 1)]
  },
  {
    // 志愿者配送延误
    id: 'r3',
    itemId: 'it1',
    borrowerId: 'u3',
    qty: 1,
    scenario: 'fever_night',
    method: 'volunteer_delivery',
    status: 'delivering',
    createdAt: ago(8),
    decidedAt: ago(7),
    volunteerId: 'v1',
    promisedBefore: ago(2),
    handoverPhotos: [],
    events: [
      ev('info', '陈小雨', '提交申请：孩子夜间发烧，需退热贴 1 盒，志愿者代送', 8),
      ev('success', '王桂兰', '共享人确认申请，锁定库存 1 盒', 7),
      ev('info', '林芳（志愿者）', '志愿者接单，开始配送', 6),
      ev('warning', '系统', '已超过约定送达时间 2 小时，自动提醒志愿者与借用人', 2)
    ]
  },
  {
    // 已交接待归还（门口无接触 + 拍照）
    id: 'r4',
    itemId: 'it12',
    borrowerId: 'u4',
    qty: 1,
    scenario: 'home_care',
    method: 'doorstep',
    status: 'handed_over',
    createdAt: ago(30),
    decidedAt: ago(29),
    promisedBefore: ago(28),
    settlePlan: 'return',
    handoverAt: ago(26),
    handoverPhotos: ['seed:doorstep-1'],
    handoverNote: '已放至 2号楼402 门口挂钩，拍照确认无接触交接。',
    events: [
      ev('info', '周敏', '提交申请：居家护理需要手套 1 盒', 30),
      ev('success', '李建国', '共享人确认申请，锁定库存 1 盒', 29),
      ev('success', '林芳（志愿者）', '门口无接触交接完成，借用人拍照确认；约定用完后归还', 26)
    ]
  },
  {
    // 已交接，约定补充新品
    id: 'r5',
    itemId: 'it4',
    borrowerId: 'u1',
    qty: 10,
    scenario: 'wound_elderly',
    method: 'pickup',
    status: 'handed_over',
    createdAt: ago(50),
    decidedAt: ago(49),
    promisedBefore: ago(48),
    settlePlan: 'replenish',
    handoverAt: ago(47),
    handoverPhotos: ['seed:pickup-1'],
    handoverNote: '自取完成，当面核对包装与效期。约定一周内补充 10 片同款创可贴。',
    events: [
      ev('info', '王桂兰', '提交申请：老人小伤口处理需创可贴 10 片', 50),
      ev('success', '赵磊', '共享人确认申请，锁定库存 10 片', 49),
      ev('success', '王桂兰', '自取交接完成并拍照；约定补充同款新品 10 片', 47)
    ]
  },
  {
    // 已归还完成的历史单
    id: 'r6',
    itemId: 'it6',
    borrowerId: 'u2',
    qty: 1,
    scenario: 'fever_night',
    method: 'pickup',
    status: 'returned',
    createdAt: ago(160),
    decidedAt: ago(159),
    promisedBefore: ago(158),
    settlePlan: 'return',
    handoverAt: ago(157),
    handoverPhotos: ['seed:pickup-2'],
    handoverNote: '自取 LR41 电池 1 卡',
    settleNote: '电池未使用，原封归还，志愿者复核包装完好后重新入库。',
    events: [
      ev('info', '李建国', '提交申请：体温计没电急需 LR41 电池', 160),
      ev('success', '赵磊', '共享人确认申请', 159),
      ev('success', '李建国', '自取交接完成', 157),
      ev('success', '林芳（志愿者）', '归还完成：物品未使用、包装完好，重新上架可借', 150)
    ]
  },
  {
    // 借用人迟迟未取 → 已逾期关闭，库存释放
    id: 'r7',
    itemId: 'it3',
    borrowerId: 'u5',
    qty: 1,
    scenario: 'home_care',
    method: 'pickup',
    status: 'overdue',
    createdAt: ago(54),
    decidedAt: ago(52),
    promisedBefore: ago(28),
    handoverPhotos: [],
    closeReason: '超过约定取货时间 24 小时未取，多次提醒无回应，申请关闭并释放库存',
    events: [
      ev('info', '赵磊', '提交申请：纱布 1 袋，选择自取', 54),
      ev('success', '王桂兰', '共享人确认申请，锁定库存 1 袋', 52),
      ev('warning', '系统', '已到约定取货时间，借用人尚未取走', 28),
      ev('danger', '林芳（志愿者）', '逾期未取，关闭申请并释放库存', 4)
    ]
  },
  {
    // 共享人撤回导致取消
    id: 'r8',
    itemId: 'it11',
    borrowerId: 'u4',
    qty: 1,
    scenario: 'mask_emergency',
    method: 'doorstep',
    status: 'recalled',
    createdAt: ago(40),
    decidedAt: ago(39),
    promisedBefore: ago(38),
    handoverPhotos: [],
    closeReason: '共享人家中仍需自用，撤回该物品，申请自动取消',
    events: [
      ev('info', '周敏', '提交申请：儿童口罩 1 袋', 40),
      ev('success', '王桂兰', '共享人确认申请', 39),
      ev('danger', '王桂兰', '共享人撤回物品，申请取消并通知借用人', 10)
    ]
  },
  {
    // 包装破损反馈关联的已交接单
    id: 'r9',
    itemId: 'it13',
    borrowerId: 'u3',
    qty: 5,
    scenario: 'wound_elderly',
    method: 'volunteer_delivery',
    status: 'handed_over',
    createdAt: ago(26),
    decidedAt: ago(25),
    volunteerId: 'v2',
    promisedBefore: ago(24),
    settlePlan: 'replenish',
    handoverAt: ago(24),
    handoverPhotos: ['seed:delivery-1'],
    handoverNote: '志愿者送达，借用人已收到。',
    events: [
      ev('info', '陈小雨', '提交申请：创可贴 5 片', 26),
      ev('success', '陈小雨（共享人本人物品）', '系统流转：等待志愿者配送', 25),
      ev('info', '郑涛（志愿者）', '志愿者接单配送', 25),
      ev('success', '郑涛（志愿者）', '配送完成，拍照交接', 24),
      ev('danger', '陈小雨', '反馈：内包装有 2 片封口开裂（包装破损）', 12)
    ]
  },
  {
    // 当前仍在等待自取、即将超时的申请（用于“迟迟未取”提醒演示）
    id: 'r10',
    itemId: 'it3',
    borrowerId: 'u4',
    qty: 1,
    scenario: 'wound_elderly',
    method: 'pickup',
    status: 'approved',
    createdAt: ago(30),
    decidedAt: ago(29),
    promisedBefore: ago(3),
    handoverPhotos: [],
    events: [
      ev('info', '周敏', '提交申请：老人伤口处理需纱布 1 袋，自取', 30),
      ev('success', '王桂兰', '共享人确认申请，锁定库存 1 袋', 29),
      ev('warning', '系统', '已超过约定取货时间 3 小时，等待借用人取走', 3)
    ]
  }
]

export const SEED_FEEDBACKS: Feedback[] = [
  {
    id: 'f1',
    itemId: 'it13',
    requestId: 'r9',
    reporterId: 'u3',
    type: 'package_damaged',
    description: '收到的卡通创可贴内有 2 片独立封口开裂，不敢使用，已单独放置。',
    photos: ['seed:damage-1'],
    status: 'open',
    createdAt: ago(12),
    events: [ev('danger', '陈小雨', '提交包装破损反馈，等待社区核实', 12)]
  },
  {
    id: 'f2',
    itemId: 'it14',
    reporterId: 'u3',
    type: 'adverse_reaction',
    description: '使用纱布覆盖伤口后，周围皮肤发红发痒，已取下并用清水冲洗。',
    photos: [],
    status: 'escalated',
    createdAt: ago(20),
    handledBy: 's1',
    handleNote: '已电话回访，建议停用并就医观察；同批次物品下架回收报废，记录在案。',
    events: [
      ev('danger', '陈小雨', '提交疑似不适反应反馈', 20),
      ev('warning', '郑涛（志愿者）', '志愿者初核：情况属实，上报社区', 19),
      ev('danger', '孙丽（社区工作人员）', '社区介入：停用、就医建议、物品报废，全流程留痕', 18)
    ]
  },
  {
    id: 'f3',
    itemId: 'it7',
    reporterId: 'u2',
    type: 'other',
    description: '建议在取货点放置一张登记本，方便邻居核对数量。',
    photos: [],
    status: 'resolved',
    createdAt: ago(36),
    handledBy: 's1',
    handleNote: '已在 3号楼共享药箱放置纸质登记本，感谢建议。',
    events: [
      ev('info', '李建国', '提交建议', 36),
      ev('success', '孙丽（社区工作人员）', '建议已采纳并处理完成', 34)
    ]
  }
]

export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    userId: 'u3',
    kind: 'danger',
    title: '配送延误提醒',
    body: '您申请的“儿童退热贴”已超过约定送达时间，志愿者正在处理，可在“我的借用”中查看进展或取消申请。',
    at: ago(2),
    read: false,
    link: '/my-borrows'
  },
  {
    id: 'n2',
    userId: 'u1',
    kind: 'warning',
    title: '效期临近提醒',
    body: '您共享的“无菌纱布块”距有效期不足 7 天，请优先流转；到期未借出将由社区统一报废。',
    at: ago(12),
    read: false,
    link: '/my-shares'
  },
  {
    id: 'n3',
    userId: 'u1',
    kind: 'info',
    title: '多人申请提醒',
    body: '您共享的“一次性医用外科口罩”目前有 2 位邻居申请，请及时确认，先确认的申请锁定库存。',
    at: ago(1),
    read: false,
    link: '/my-shares'
  },
  {
    id: 'n4',
    userId: 'v1',
    kind: 'warning',
    title: '配送任务已延误',
    body: '您承接的“儿童退热贴”配送已超过约定时间，请尽快送达或联系借用人改期。',
    at: ago(2),
    read: false,
    link: '/volunteer'
  },
  {
    id: 'n5',
    userId: 'v1',
    kind: 'info',
    title: '新物品待审核',
    body: '有 2 件新登记物品等待审核，请注意核对效期、包装与准入要求。',
    at: ago(2),
    read: false,
    link: '/volunteer'
  },
  {
    id: 'n6',
    userId: 's1',
    kind: 'danger',
    title: '过期物品待报废',
    body: '“生理性盐水 100ml（外用冲洗）”已过有效期并暂停借用，请尽快安排回收报废。',
    at: ago(72),
    read: false,
    link: '/staff'
  },
  {
    id: 'n7',
    userId: 's1',
    kind: 'warning',
    title: '包装破损反馈待处理',
    body: '“卡通创可贴（儿童款）”接到包装破损反馈，请核实并决定替换或下架。',
    at: ago(12),
    read: false,
    link: '/staff'
  },
  {
    id: 'n8',
    userId: 'u4',
    kind: 'warning',
    title: '请尽快取走借用物品',
    body: '您申请的“无菌纱布块”已超过约定取货时间 3 小时，请今日内取走，否则申请将被关闭。',
    at: ago(3),
    read: false,
    link: '/my-borrows'
  }
]
