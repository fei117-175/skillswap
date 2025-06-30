import { defineStore } from "pinia"

export const useCounterStore = defineStore('counter', {
  state: () => {
    return {
      loginUser: false, // 登录状态
      userData: null,   // 用户数据
      token: null       // token信息
    }
  },
  getters: {
    isLoggedIn: (state) => state.loginUser,
    getUserData: (state) => state.userData
  },
  actions: {
    loginSuccess(data) {
      this.loginUser = true
      this.userData = data.user
      this.token = data.tokens
    },
    logout() {
      this.loginUser = false
      this.userData = null
      this.token = null
    },
    setUserData(data) {
      this.userData = data
    },
  },
  persist: {
    key: 'skillswap_store',
    storage: window.localStorage, // 改为localStorage以便持久化
    paths: ['loginUser', 'userData', 'token'],
  },
})