---
title: "如何给你的小米设备编译 DroidSpaces 内核（v2）"
published: 2026-05-06
description: "用 GitHub Actions 云端编译 DroidSpaces 内核的 v2 版教程：fork GKI_KernelSU_SUSFS、选好内核版本与补丁、启用 NTsync，下载并刷入 AnyKernel3，附备份 boot 与救砖流程。"
image: "/images/posts/droidspaces-gki-cloud-build-v2/cover.webp"
tags: ["Droidspaces", "内核", "小米", "刷机", "教程"]
category: "教程"
draft: false
---

昨天在 QQ 群里水群的时候，发现我的上一篇内核编译教程涉及的的项目里，原作者更新了 DroidSpaces 支持。教程的内容已经不适用于现在的 GKI_KernelSU_SUSFS 项目了，正好我觉得上一篇教程还有一些不足的地方，而且上一篇教程没有开启 NTsync 功能，因此写一篇 v2 版本的 Droidspaces 内核编译教程，适配现在的 GKI_KernelSU_SUSFS 项目，添加了 NTsync。

> 本文最早以图文形式发布在酷安：[查看原文](https://www.coolapk.com/feed/71592598?s=OGEzODY1YWMxNzVkNTgzZzZhY2IyNGU1ega1621)

## 解答一些可能的疑惑

1. [什么是 DroidSpaces](https://www.coolapk.com/feed/71445199)
2. [什么是 NTsync](https://www.coolapk.com/feed/71322774)
3. [上一篇教程](https://www.coolapk.com/feed/71447028)

## 准备工作

1. 需要刷写内核的米系设备（需要解锁 Bootloader 并 root，下载安装好 Kernel Flasher 并授予 root 权限，我这里用 Xiaomi Pad 8 Pro 演示），我这里为了方便，后面都称作设备 A。
2. 一台电脑，要能正常访问 github 并能下载东西。

## 备注

1. 要给设备 A 安装多系统工具箱，并授予 root 权限。
2. 设备 A 推荐使用 LKM 模式 root，以免还原内核导致掉 root。
3. 以上软件可以在网盘中下载：[点击下载（提取码 0721）](https://1843766883.share.123865.com/123pan/WjxbTd-vfbP?pwd=0721)

下面正式开始：

### 一、备份当前系统原版 boot

安卓的内核是在 boot 里面的，因此我们要备份 boot.img，在卡米的时候进 fastboot 刷入救砖。在设备 A 上打开多系统工具箱吗，点击菜单，点击 img 镜像文件操作

![](/images/posts/droidspaces-gki-cloud-build-v2/01.webp)

点击“提取或刷写分区镜像”，搜索 boot，根据你设备当前的分区提取 boot，我这里是 a 分区，所以提取 boot_a。

![](/images/posts/droidspaces-gki-cloud-build-v2/02.webp)

提取之后，打开文件管理器或者 MT 管理器，在 `/sdcard/Rannki` 目录中找到刚刚提取的 boot，把 boot.img 复制或者分享到电脑中保存好

![](/images/posts/droidspaces-gki-cloud-build-v2/03.webp)

### 二、编译内核

打开我的项目 <https://github.com/404-GCross/GKI_KernelSU_SUSFS>，点击 fork

我的项目分支相比于原版，添加了 NTsync 支持如果你不需要 NTsync，fork 原作者项目也可以

https://github.com/zzh20188/GKI_KernelSU_SUSFS

![](/images/posts/droidspaces-gki-cloud-build-v2/04.webp)

不要勾选"Copy the dev branch only"，然后点击 Create fork

![](/images/posts/droidspaces-gki-cloud-build-v2/05.webp)

fork 我的项目之后，点击 Action

![](/images/posts/droidspaces-gki-cloud-build-v2/06.webp)

选择你的设备对应的内核版本，我这里是 6.6

![](/images/posts/droidspaces-gki-cloud-build-v2/07.webp)

注：内核版本与你的系统安卓版本并不一致，需要在系统设置里的设备详情查看内核版本

![](/images/posts/droidspaces-gki-cloud-build-v2/08.webp)

点击右边的 Run workflow，点击选择分支，选择 404-GCross-Droidspaces-NTsync，然后点击启用 NTsync，选择对应的 Droidspaces 支持，我测试过，6.6 的米系设备是 345，所以这里我选择 345，

其他版本的内核可以看看话题里其他酷友的测试，看看使用的是哪个补丁，也可以全都编译一遍然后一个一个刷入测试。

![](/images/posts/droidspaces-gki-cloud-build-v2/09.webp)

如果你想要刷入的内核里带有你的名字，就在这个自定义版本名称这里输入你想要的名字

![](/images/posts/droidspaces-gki-cloud-build-v2/10.webp)

填写完之后点击 Run workflows 开始编译。

编译时间有点长，需要大概半小时，耐心等待。

编译完成之后，点击对应的 workflows，在 summary 这里往下滑，找到对应的内核然后点击下载，米系 8Elite 是 6.6.77，同时也把 root 管理器下载下来

![](/images/posts/droidspaces-gki-cloud-build-v2/11.webp)

解压出 ReSukiSU 的 manager-release 里的 arm64-v8a 版本，安装在 A 设备上，然后解压内核压缩包，提取出里面的 AnyKernel3 内核包

![](/images/posts/droidspaces-gki-cloud-build-v2/12.webp)

![](/images/posts/droidspaces-gki-cloud-build-v2/13.webp)

将 AnyKernel3 内核包复制到 A 设备，然后使用 Kernel Flasher 刷入

### 三、刷入内核

打开 Kernel Flasher，找到你设备当前的插槽（写着已挂载的），点击对应插槽框里右上角查看。

这里的 Invalid ramdisk in boot.img 是因为修补了 init_boot，不要紧的。

![](/images/posts/droidspaces-gki-cloud-build-v2/14.webp)

点击刷入

![](/images/posts/droidspaces-gki-cloud-build-v2/15.webp)

刷入 AK3 压缩包

![](/images/posts/droidspaces-gki-cloud-build-v2/16.webp)

找到你的 AK3 内核包，选择并确定，刷入之后，点击最下面的重启

![](/images/posts/droidspaces-gki-cloud-build-v2/17.webp)

重启

![](/images/posts/droidspaces-gki-cloud-build-v2/18.webp)

要是选择了正确的内核包且运气好的话，这会你就能开机

打开 Droidspaces APP，点击右上角的设置

![](/images/posts/droidspaces-gki-cloud-build-v2/19.webp)

点击要求，检查要求

![](/images/posts/droidspaces-gki-cloud-build-v2/20.webp)

![](/images/posts/droidspaces-gki-cloud-build-v2/21.webp)

如果这里全是打勾的，那么恭喜你，成功编译并刷入了自己的 Droidspaces 内核。

打开 ReSukiSU 就能看到你的 GKI root。

![](/images/posts/droidspaces-gki-cloud-build-v2/22.webp)

### 四、救砖

如果不幸卡米，无限重启的话，就同时按着电源键和音量下键，直到重启进入 fastboot 模式

![](/images/posts/droidspaces-gki-cloud-build-v2/23.webp)

用 USB 数据线连接你的设备与电脑，连接之后在电脑找到 fastboot 工具包目录，在上方地址栏里输入 cmd 并回车，就可以在这个目录下打开 cmd

![](/images/posts/droidspaces-gki-cloud-build-v2/24.webp)

输入 `fastboot devices`，看看有没有设备

![](/images/posts/droidspaces-gki-cloud-build-v2/25.webp)

如果有像这样的信息就说明你的设备连上电脑了，然后输入

```bash
fastboot flash boot
```

先不要回车，把你在设备 A 上通过多系统工具箱提取的 boot.img 拖进去，像这样

![](/images/posts/droidspaces-gki-cloud-build-v2/26.webp)

接下来回车就能刷入 boot 把内核换回原来的了，接着输入 `fastboot reboot` 就能重启然后开机。

![](/images/posts/droidspaces-gki-cloud-build-v2/27.webp)

接着再尝试其他补丁的内核或者找找为什么不开机的原因，重新刷入测试。

现在这个方案会比 v1 版本的好很多，只需要 fork 然后进入 action 编译就好，不用去修改代码了，而且也可以在 action 修改内核版本名称了，还带有 NTsync。救砖也不需要去下载刷机包了，直接从系统提取 boot。如果用我的项目在编译过程中出现 bug 或者未知报错 ，欢迎评论区反馈。
