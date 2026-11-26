import { useState } from 'react'
import { Coffee, ExternalLink } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// 收款码与赞助链接配置：
// - img 指向 public/ 下的图片，替换成真实收款码后更新路径（或直接覆盖同名文件）
// - buymeacoffee 填上你的主页链接后，卡片底部会显示外链赞助按钮；留空则不显示
const DONATE = {
  alipay: { label: '支付宝', img: '/donate/alipay.png', dot: 'bg-[#1677FF]' },
  wechat: { label: '微信', img: '/donate/wechat.png', dot: 'bg-[#07C160]' },
  buymeacoffee: '',
}

export function DonateButton() {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label="赞赏支持"
            className="flex size-12 items-center justify-center rounded-full border border-slate-200 bg-white text-rose-500 shadow-lg shadow-slate-900/10 outline-hidden transition-all duration-150 hover:scale-105 hover:text-rose-600 active:scale-95 cursor-pointer"
          />
        }
      >
        <Coffee className="size-5" />
      </PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={12} className="w-80 gap-3 p-4">
        <div className="flex items-center gap-2">
          <Coffee className="size-4 text-rose-500" />
          <span className="font-medium">请我喝杯咖啡</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[DONATE.alipay, DONATE.wechat].map(item => (
            <div key={item.label} className="flex flex-col items-center gap-1.5">
              <img
                src={item.img}
                alt={`${item.label}收款码`}
                className="w-full aspect-square rounded-lg border border-slate-200 object-cover"
              />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className={cn('size-1.5 rounded-full', item.dot)} />
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">扫码打赏，感谢你的支持</p>
        {DONATE.buymeacoffee && (
          <a
            href={DONATE.buymeacoffee}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-rose-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-rose-600"
          >
            <ExternalLink className="size-3.5" />
            Buy Me a Coffee
          </a>
        )}
      </PopoverContent>
    </Popover>
  )
}
