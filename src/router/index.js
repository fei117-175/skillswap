

import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name:'welcome',
      component:()=>import('@/views/welcome.vue') // 懒加载
    },
    {
      path: '/index',
      name: '首页',
      component: () => import('@/views/index.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue')
    },
    {
      path: '/application',
      name: 'application',
      component: () => import('@/views/application.vue')
    },
    // 补充缺失的路由
    {
      path: '/skillsquare',
      name: 'skillsquare',
      component: () => import('@/views/skillsquare.vue')
    },
    {
      path: '/knowus',
      name: 'knowus',
      component: () => import('@/views/knowus.vue')
    },
    {
      path:'/profile/:sk_id',
      name:'profile',
      component:()=>import('@/views/profile.vue')
    },
    {
      path:'/notes',
      name:'notes',
      component:()=>import('@/views/notes.vue')
    },
    {
      path:'/collection',
      name:'collection',
      component:()=>import('@/views/collection.vue')
    },
    {
    path: '/blog/:id', // 动态路由参数
    name: 'blog-detail',
    component: ()=>import('@/views/BlogDetail.vue'),
    props: true // 将路由参数作为props传递
  }
  ]
})

export default router