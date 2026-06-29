import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'Login', component: () => import('../views/Login.vue'), meta: { title: '登录' } },
    {
      path: '/',
      component: () => import('../layout/AdminLayout.vue'),
      redirect: '/dashboard',
      children: [
        { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '仪表盘' } },
        { path: 'parking-lots', name: 'ParkingLots', component: () => import('../views/ParkingLots.vue'), meta: { title: '停车场管理' } },
        { path: 'parking-spots', name: 'ParkingSpots', component: () => import('../views/ParkingSpots.vue'), meta: { title: '车位管理' } },
        { path: 'coupons', name: 'AdminCoupons', component: () => import('../views/Coupons.vue'), meta: { title: '优惠券管理' } },
        { path: 'users', name: 'Users', component: () => import('../views/Users.vue'), meta: { title: '用户管理' } },
        { path: 'admins', name: 'Admins', component: () => import('../views/Admins.vue'), meta: { title: '管理员管理' } },
        { path: 'settings', name: 'Settings', component: () => import('../views/Settings.vue'), meta: { title: '个人设置' } }
      ]
    }
  ]
})

const whiteList = ['/login']

router.beforeEach((to, _from) => {
  const token = localStorage.getItem('adminToken')
  if (!token && !whiteList.includes(to.path)) {
    return '/login'
  }
})

export default router
