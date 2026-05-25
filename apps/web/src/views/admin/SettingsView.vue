<template>
  <PageShell>
    <PanelCard title="基础配置">
      <FormSection title="核心参数">
        <div v-if="loadError" class="settings-alert settings-alert--error">
          {{ loadError }}
        </div>

        <div v-if="saveMessage" class="settings-alert settings-alert--success">
          {{ saveMessage }}
        </div>

        <div class="settings-grid">
          <label class="settings-field">
            <span>后台账号</span>
            <input v-model.trim="form.user" type="text" :disabled="loading || saving" />
            <small v-if="errors.user" class="settings-field__error">{{ errors.user }}</small>
          </label>

          <label class="settings-field">
            <span>后台密码</span>
            <input v-model="form.pass" type="text" :disabled="loading || saving" />
            <small v-if="errors.pass" class="settings-field__error">{{ errors.pass }}</small>
          </label>

          <label class="settings-field settings-field--wide">
            <span>异步通知地址</span>
            <input
              v-model.trim="form.notifyUrl"
              type="text"
              :disabled="loading || saving"
            />
            <small v-if="errors.notifyUrl" class="settings-field__error">
              {{ errors.notifyUrl }}
            </small>
          </label>

          <label class="settings-field settings-field--wide">
            <span>同步返回地址</span>
            <input
              v-model.trim="form.returnUrl"
              type="text"
              :disabled="loading || saving"
            />
            <small v-if="errors.returnUrl" class="settings-field__error">
              {{ errors.returnUrl }}
            </small>
          </label>

          <label class="settings-field">
            <span>商户 Key</span>
            <input v-model.trim="form.key" type="text" :disabled="loading || saving" />
          </label>

          <label class="settings-field">
            <span>关闭分钟数</span>
            <input v-model.trim="form.close" type="text" :disabled="loading || saving" />
            <small v-if="errors.close" class="settings-field__error">{{ errors.close }}</small>
          </label>

          <label class="settings-field">
            <span>金额区分模式</span>
            <select v-model="form.payQf" :disabled="loading || saving">
              <option value="1">金额递增</option>
              <option value="2">金额递减</option>
            </select>
          </label>
        </div>
      </FormSection>
    </PanelCard>

    <PanelCard title="支付二维码配置">
      <div class="settings-qr-grid">
        <section class="settings-qr-card">
          <header class="settings-qr-card__header">
            <div>
              <h3>微信二维码</h3>
            </div>
          </header>

          <label class="settings-field settings-field--wide">
            <span>二维码内容</span>
            <textarea
              v-model.trim="form.wxpay"
              rows="5"
              :disabled="loading || saving || decodingWechat"
              @input="handlePreviewUpdate('wechat')"
            ></textarea>
          </label>

          <div class="settings-qr-card__actions">
            <input
              type="file"
              accept="image/*"
              :disabled="loading || saving || decodingWechat"
              @change="handleFileChange($event, 'wechat')"
            />
            <span class="settings-qr-card__status">
              {{ wechatMessage || (decodingWechat ? '正在解析二维码图片...' : '等待上传图片') }}
            </span>
          </div>

          <div class="settings-preview">
            <img
              v-if="wechatPreviewUrl"
              :src="wechatPreviewUrl"
              alt="微信二维码预览"
              class="settings-preview__image"
            />
            <p v-else class="settings-preview__empty">微信二维码预览将在这里显示</p>
          </div>
        </section>

        <section class="settings-qr-card">
          <header class="settings-qr-card__header">
            <div>
              <h3>支付宝二维码</h3>
            </div>
          </header>

          <label class="settings-field settings-field--wide">
            <span>二维码内容</span>
            <textarea
              v-model.trim="form.zfbpay"
              rows="5"
              :disabled="loading || saving || decodingAlipay"
              @input="handlePreviewUpdate('alipay')"
            ></textarea>
          </label>

          <div class="settings-qr-card__actions">
            <input
              type="file"
              accept="image/*"
              :disabled="loading || saving || decodingAlipay"
              @change="handleFileChange($event, 'alipay')"
            />
            <span class="settings-qr-card__status">
              {{ alipayMessage || (decodingAlipay ? '正在解析二维码图片...' : '等待上传图片') }}
            </span>
          </div>

          <div class="settings-preview">
            <img
              v-if="alipayPreviewUrl"
              :src="alipayPreviewUrl"
              alt="支付宝二维码预览"
              class="settings-preview__image"
            />
            <p v-else class="settings-preview__empty">支付宝二维码预览将在这里显示</p>
          </div>
        </section>
      </div>
    </PanelCard>

    <PanelCard title="保存设置">
      <div class="settings-save-bar">
        <button class="settings-save-bar__button" :disabled="loading || saving" @click="handleSave">
          {{ saving ? '正在保存...' : '保存系统设置' }}
        </button>
      </div>
    </PanelCard>
  </PageShell>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import FormSection from '../../components/admin/FormSection.vue';
import PageShell from '../../components/admin/PageShell.vue';
import PanelCard from '../../components/admin/PanelCard.vue';
import {
  buildQrcodePreviewUrl,
  decodeQrcodeFromFile,
  fetchSettings,
  saveSettings
} from '../../services/settings-service.js';
import {
  createDefaultSettingsForm,
  mapFormToSettingsPayload,
  mapSettingsToForm,
  validateSettingsForm
} from '../../utils/settings-form.js';

/**
 * 系统设置页面
 * 负责读取和保存后台设置，并提供二维码上传解析与预览能力。
 */
const form = reactive(createDefaultSettingsForm());
const errors = reactive({});
const loading = ref(true);
const saving = ref(false);
const loadError = ref('');
const saveMessage = ref('');
const wechatPreviewUrl = ref('');
const alipayPreviewUrl = ref('');
const wechatMessage = ref('');
const alipayMessage = ref('');
const decodingWechat = ref(false);
const decodingAlipay = ref(false);

/**
 * 同步表单错误信息
 * 每次保存前清空旧错误，避免残留提示影响判断。
 */
function syncErrors(nextErrors) {
  for (const key of Object.keys(errors)) {
    delete errors[key];
  }

  for (const [key, value] of Object.entries(nextErrors)) {
    errors[key] = value;
  }
}

/**
 * 刷新二维码预览
 * 录入文本后立刻生成预览地址，方便用户确认内容。
 */
function handlePreviewUpdate(type) {
  if (type === 'wechat') {
    wechatPreviewUrl.value = buildQrcodePreviewUrl(form.wxpay.trim());
    return;
  }

  alipayPreviewUrl.value = buildQrcodePreviewUrl(form.zfbpay.trim());
}

/**
 * 应用后端设置数据
 * 读取成功后统一回填表单并刷新二维码预览。
 */
function applySettings(settings) {
  const mapped = mapSettingsToForm(settings);
  Object.assign(form, mapped);
  handlePreviewUpdate('wechat');
  handlePreviewUpdate('alipay');
}

/**
 * 加载系统设置
 * 页面初始化时读取后端配置，失败时显示页内错误提示。
 */
async function loadSettings() {
  loading.value = true;
  loadError.value = '';

  try {
    const settings = await fetchSettings();
    applySettings(settings);
    console.info('[TP-15][settings] 系统设置读取成功');
  } catch (error) {
    loadError.value = '系统设置读取失败，请刷新页面后重试';
    console.error('[TP-15][settings] 系统设置读取失败', {
      message: error.message
    });
  } finally {
    loading.value = false;
  }
}

/**
 * 处理二维码图片上传解析
 * 解析成功后回填文本并立即刷新预览。
 */
async function handleFileChange(event, type) {
  const [file] = event.target.files || [];

  if (!file) {
    return;
  }

  const decodingFlag = type === 'wechat' ? decodingWechat : decodingAlipay;
  const messageRef = type === 'wechat' ? wechatMessage : alipayMessage;

  decodingFlag.value = true;
  messageRef.value = '';

  try {
    const result = await decodeQrcodeFromFile(file);

    if (result.ok && result.text) {
      if (type === 'wechat') {
        form.wxpay = result.text;
      } else {
        form.zfbpay = result.text;
      }

      handlePreviewUpdate(type);
      messageRef.value = '二维码解析成功，内容已自动回填';
      console.info('[TP-15][settings] 二维码图片解析成功', {
        type
      });
    } else {
      messageRef.value = '二维码解析失败，请更换图片后重试';
    }
  } catch (error) {
    messageRef.value = '二维码解析失败，请更换图片后重试';
    console.warn('[TP-15][settings] 二维码图片解析失败', {
      type,
      message: error.message
    });
  } finally {
    decodingFlag.value = false;
    event.target.value = '';
  }
}

/**
 * 保存系统设置
 * 先执行最小前端校验，成功后调用后端保存接口。
 */
async function handleSave() {
  saveMessage.value = '';
  const nextErrors = validateSettingsForm(form);
  syncErrors(nextErrors);

  if (Object.keys(nextErrors).length > 0) {
    return;
  }

  saving.value = true;

  try {
    const result = await saveSettings(mapFormToSettingsPayload(form));

    if (result.ok) {
      saveMessage.value = '系统设置已保存';
      console.info('[TP-15][settings] 系统设置保存成功');
      return;
    }

    saveMessage.value = result.message || '系统设置保存失败，请稍后重试';
  } catch (error) {
    saveMessage.value = '系统设置保存失败，请稍后重试';
    console.error('[TP-15][settings] 系统设置保存失败', {
      message: error.message
    });
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  await loadSettings();
});
</script>
