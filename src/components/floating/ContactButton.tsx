import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// 联系方式配置：填上后对应行才会显示
const CONTACT = {
  email: '', // 例如 'hello@example.com'
  wechat: '', // 例如 'my_wechat_id'
  wechatQr: '/donate/wechat-contact.png',
}

function WechatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  )
}

export function ContactButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState('')

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    }).catch(() => {})
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="联系我"
            className="flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white text-[#07C160] shadow-lg shadow-slate-900/10 outline-hidden transition-all duration-150 hover:scale-105 hover:text-[#06AD56] active:scale-95 cursor-pointer"
          />
        }
      >
        <WechatIcon className="size-5" />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={12} className="w-72 gap-3 p-4">
        <div className="flex items-center gap-2">
          <WechatIcon className="size-4 text-[#07C160]" />
          <span className="font-medium">联系我</span>
        </div>

        {CONTACT.email && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="truncate text-sm text-muted-foreground">{CONTACT.email}</span>
            <button
              type="button"
              onClick={() => handleCopy(CONTACT.email, 'email')}
              aria-label="复制邮箱"
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground cursor-pointer"
            >
              {copied === 'email' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        )}

        {CONTACT.wechat && (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <MessageCircle className="size-3.5 shrink-0 text-[#07C160]" />
              {CONTACT.wechat}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(CONTACT.wechat, 'wechat')}
              aria-label="复制微信号"
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-slate-200 hover:text-foreground cursor-pointer"
            >
              {copied === 'wechat' ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        )}

        {CONTACT.wechatQr && (
          <>
            <img
              src={CONTACT.wechatQr}
              alt="微信二维码"
              className="w-full aspect-square rounded-lg border border-slate-200 object-cover"
            />
            <p className="text-center text-xs text-muted-foreground">扫码添加微信</p>
          </>
        )}

        {!CONTACT.email && !CONTACT.wechat && !CONTACT.wechatQr && (
          <p className={cn('text-center text-xs text-muted-foreground')}>联系方式待配置</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
