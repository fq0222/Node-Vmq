<template>
  <main class="login-view">
    <section class="login-view__panel">
      <h1>后台登录</h1>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="login-form__field">
          <span>管理账号</span>
          <input
            v-model.trim="form.user"
            type="text"
            name="user"
            autocomplete="username"
            placeholder="请输入后台账号"
            :disabled="authStore.loading"
          />
        </label>

        <label class="login-form__field">
          <span>登录密码</span>
          <input
            v-model="form.pass"
            type="password"
            name="pass"
            autocomplete="current-password"
            placeholder="请输入登录密码"
            :disabled="authStore.loading"
          />
        </label>

        <p v-if="validationMessage || authStore.errorMessage" class="login-form__error">
          {{ validationMessage || authStore.errorMessage }}
        </p>

        <button type="submit" class="login-view__primary" :disabled="authStore.loading">
          {{ authStore.loading ? '登录中...' : '登录后台' }}
        </button>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

/**
 * 后台登录页面
 * 负责提交真实登录请求，并在表单内联展示失败提示。
 */
const router = useRouter();
const authStore = useAuthStore();
const validationMessage = ref('');
const form = reactive({
  user: '',
  pass: ''
});

/**
 * 校验登录表单
 * 仅保留本次必需的账号和密码非空校验。
 */
function validateForm() {
  if (!form.user) {
    return '请输入管理账号';
  }

  if (!form.pass) {
    return '请输入登录密码';
  }

  return '';
}

/**
 * 提交真实登录请求
 * 登录成功后进入后台首页，失败时在表单内联显示错误信息。
 */
async function handleSubmit() {
  validationMessage.value = validateForm();
  authStore.clearError();

  if (validationMessage.value) {
    return;
  }

  const success = await authStore.login(form);

  if (success) {
    console.info('[TP-14][login] 登录成功，准备跳转后台首页');
    router.push('/dashboard');
  }
}
</script>
