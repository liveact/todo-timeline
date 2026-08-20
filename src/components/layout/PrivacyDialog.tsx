import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function PrivacyDialog() {
  return (
    <Dialog>
      <DialogTrigger className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        隐私与数据
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>隐私与数据</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-muted-foreground">
          <section>
            <h4 className="font-medium text-foreground mb-1">数据存储</h4>
            <p>
              你的数据仅存储在当前浏览器中，不会上传具体内容。
              <span className="text-amber-600">清除浏览器数据可能会导致任务丢失。</span>
            </p>
          </section>
          <section>
            <h4 className="font-medium text-foreground mb-1">使用统计</h4>
            <p>
              本站会收集部分匿名的使用行为，用于了解产品使用情况和改进功能：
            </p>
            <ul className="list-disc list-inside mt-1.5 space-y-0.5">
              <li>网站访问</li>
              <li>创建任务的行为</li>
              <li>完成任务的行为</li>
            </ul>
            <p className="mt-1.5">
              本站不会收集任务名称、描述、备注等内容，也不会通过统计数据识别你的个人身份。
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
