import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      component: () => import('../layout/MobileLayout.vue'),
      redirect: '/home',
      children: [
        { path: 'home', name: 'Home', component: () => import('../views/Home.vue'), meta: { title: '首页' } },
        { path: 'order', name: 'Order', component: () => import('../views/Order.vue'), meta: { title: '订单' } },
        { path: 'message', name: 'Message', component: () => import('../views/Message.vue'), meta: { title: '消息' } },
        { path: 'profile', name: 'Profile', component: () => import('../views/Profile.vue'), meta: { title: '我的' } }
      ]
    },
    { path: '/parking-lot/:id', name: 'ParkingLotDetail', component: () => import('../views/ParkingLotDetail.vue'), meta: { title: '停车场详情' } },
    { path: '/vehicles', name: 'Vehicles', component: () => import('../views/Vehicles.vue'), meta: { title: '车辆管理' } },
    { path: '/coupons', name: 'Coupons', component: () => import('../views/Coupons.vue'), meta: { title: '我的优惠券' } },
    { path: '/wallet', name: 'Wallet', component: () => import('../views/Wallet.vue'), meta: { title: '钱包' } },
    { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { title: '登录' } }
  ]
})

export default router
