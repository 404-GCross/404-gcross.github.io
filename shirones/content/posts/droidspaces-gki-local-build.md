---
title: "（本地编译版）如何给你的小米设备编译 Droidspaces 内核"
published: 2026-06-02
description: "从 WSL 环境准备、镜像源配置，到本地拉取源码编译并刷入 Droidspaces 内核的完整流程，附刷砖后的救砖方法。"
image: "/images/posts/droidspaces-gki-local-build/cover.webp"
tags: ["Droidspaces", "内核", "小米", "刷机", "教程"]
category: "教程"
draft: false
---

折腾了两周，做了个本地编译 Droidspaces 内核的脚本，目前适用于 5.10-6.6 的米系 GKI 设备，目前已上传 Github，顺便写下教程讲述如何使用。

> 本文最早以图文形式发布在酷安：[查看原文](https://www.coolapk.com/feed/72120278)

## 项目简介

- **名称**：Droidspaces_GKI_Buildin_Local（DGBL）
- **项目地址**：https://github.com/404-GCross/Droidspaces_GKI_Buildin_Local
- **项目目的**：解决难以链接 Google 源码仓库以及 github 的问题，在本地快速流畅拉取并编译内核
- **项目支持内核**：5.10-6.12 的 GKI 内核
- **支持的发行版**：主流的基本都支持（Deb 系、Redhat 系、Arch 系）
- **目前测试通过机器**：REDMI K50 Ultra(android12-5.10.246)、XiaomiPad7（android14-6.1.118）Xiaomi15&XiaomiPad8Pro(android15-6.6.77）
- **测试不通过机器**：REDMI K90ProMax（android16-6.12.23）

本项目 99% 由 claude code + deepseek 完成，大概率还有没发现的 bug，欢迎反馈

本人内核小白，教程如有不对还望批评指正

## 目前脚本存在的问题

1. 由于 SUSFS 可能与 Droidspaces 冲突，Droidspaces 作者也不太推荐，因此脚本不支持 SUSFS，并且脚本所提供的额外内核功能未测试，不确定是否可用，现在画个饼，以后支持
2. Android16-6.12 内核的米系设备暂时不支持，我用我的 K90ProMax 备用机刷入后，卡在 OS 加载界面进不去，搞了三天都没搞明白，所以暂时放弃掉了，当然如果有大佬能告诉我啥问题就再好不过了，6.12 的米系设备用户可以看看[@cctv18_2](https://www.coolapk.com/u/cctv18_2) 大佬的云端编译项目 https://github.com/cctv18/oppo_oplus_realme_sm8850，他的项目里也有本地脚本，不过更推荐直接云端。
3. 如果编译时选择了带 root，无法像云端编译那样下载管理器，因为 Github Action 下载需要登录，只能自行访问 github 下载，脚本会在编译完成后给出获取链接。

## 准备工作

**设备**

1. 一台 win10/win11 或 linux 主流发行版的电脑（CPU 性能越强越好），这里称为设备 A，这里使用 win11 演示
2. 需要使用 Droidspaces 的设备（需要解锁 Bootloader），这里称为设备 B

**软件**

1. AnyBase Kernel (ABK)，或者 Kernel Flasher 也行，本教程使用 ABK。如果想使用 Kernel Flasher，可以看我之前的教程[《如何给你的小米设备编译 Droidspaces 内核》](https://www.coolapk.com/feed/71592598)
2. 多系统工具箱

涉及的工具可在这里下载：[点击下载（提取码 0721）](https://1843766883.share.123865.com/123pan/WjxbTd-vfbP?pwd=0721)

## 操作教程

### 一、设备 A 安装 WSL（Linux 电脑直接跳过该流程）

因为编译内核只能使用 linux，所以 Windows 上我们要编译内核的话，比较方便的方法是使用 wsl（微软 Linux 子系统）。

电脑打开控制面板

![](/images/posts/droidspaces-gki-local-build/01.webp)

切换到大图标，点击程序与功能

![](/images/posts/droidspaces-gki-local-build/02.webp)

点击左边的打开或关闭 Windows 功能

![](/images/posts/droidspaces-gki-local-build/03.webp)

找到 Windows Subsystem for Linux（适用于 Linux 的 Windows 子系统），勾选打开，然后点击 OK

![](/images/posts/droidspaces-gki-local-build/04.webp)

Windows 会执行安装程序，请耐心等待，这个过程由于需要连到微软服务器下载，可能会有亿点点。。。漫长，有条件的还是建议在这步使用 magic（你懂的）

![](/images/posts/droidspaces-gki-local-build/05.webp)

安装完之后打开微软商店，搜索 debian，选择并安装 debian

![](/images/posts/droidspaces-gki-local-build/06.webp)

你要是喜欢 Ubuntu 的话也可以

![](/images/posts/droidspaces-gki-local-build/07.webp)

安装完之后打开你下载的发行版，我这里以 debian 作演示，打开等 wsl 自行加载，接着输入你的账号密码就可以开始使用 debian 啦

![](/images/posts/droidspaces-gki-local-build/08.webp)

安装好 Linux 之后我们先来更换软件源

期间会提示输入密码，输入你刚刚设置的密码，输入密码默认是不会有显示的，直接输入就行，不用担心

![](/images/posts/droidspaces-gki-local-build/09.webp)

首先安装 curl 与 git

```bash
sudo apt install curl git
```

等待完成后输入 sudo -i 切换至 root 权限，

```bash
sudo -i
```

![](/images/posts/droidspaces-gki-local-build/10.webp)

接着运行换源脚本

```bash
bash <(curl -sSL https://linuxmirrors.cn/main.sh)
```

推荐使用中科大的

![](/images/posts/droidspaces-gki-local-build/11.webp)

根据你的需要选择 http 还是 https，接着在是否跳过更新软件包的地方选择否，他就会自动进行软件包更新，清理下载缓存选择是

![](/images/posts/droidspaces-gki-local-build/12.webp)

等待脚本跑完之后输入 exit，退出 root 权限，至此，WSL 安装与配置完成

如果不小心跳过了更新软件包，可以输入以下命令执行更新

```bash
sudo apt update && apt upgrade -y
```

### 二、运行脚本编译内核

输入以下命令，将编译脚本的项目克隆到本地 Linux

```bash
git clone https://gh-proxy.com/https://github.com/404-GCross/Droidspaces_GKI_Buildin_Local
```

![](/images/posts/droidspaces-gki-local-build/13.webp)

克隆完成后输入以下命令进入项目文件夹

```bash
cd Droidspaces_GKI_Buildin_Local/
```

给编译脚本授予可执行权限然后运行

```bash
chmod +x build_kernel.sh
./build_kernel.sh
```

输入完这两条命令之后你就会进入脚本的主界面

![](/images/posts/droidspaces-gki-local-build/14.webp)

输入 1 选择对应的 Github 镜像源，选择完之后脚本会提示是否需要测速，如果不确定这个镜像源是否可用就输入 y 回车进行测速。

![](/images/posts/droidspaces-gki-local-build/15.webp)

如果测出来的速度过慢，就输入 n 返回选择镜像源，也可以选择 6 自行输入其他镜像源。

这里顺便说一下如何获取镜像源信息，打开 [github.akams.cn](https://github.akams.cn/) 并点击节点测速

![](/images/posts/droidspaces-gki-local-build/16.webp)

等待测速完成之后打开节点选择，选择列表里带宽最高的

![](/images/posts/droidspaces-gki-local-build/17.webp)

接着在文本栏内输入随便一个属于 github 的地址，然后复制下面文本对应镜像源的文本就能获取到镜像源链接（图中选中文本的部分）

![](/images/posts/droidspaces-gki-local-build/18.webp)

然后回到 WSL 的终端里，选择自定义输入，输入刚刚获取到的镜像源地址即可

![](/images/posts/droidspaces-gki-local-build/19.webp)

测速完成后如果镜像源可用就输入 y 并回车，此时就配置好镜像源了

接着输入 2，安装内核编译所需要的依赖

![](/images/posts/droidspaces-gki-local-build/20.webp)

期间可能需要输入之前设定的密码，输入即可，依赖安装完成之后会自动回到脚本主界面

接着我们来获取内核源码，在主界面输入 3，脚本就会启动内核源码拉取脚本

![](/images/posts/droidspaces-gki-local-build/21.webp)

选择你的版本，我这里是要给朋友的 XiaomiPad7 编译内核，对应的内核版本为 6.1.118，因此我这里是这样选，选择完之后，由于内核源码拉取是另外的项目的脚本，与编译脚本独立，因此会再让你选择一次镜像源，选择镜像源然后测速或者直接使用就行

![](/images/posts/droidspaces-gki-local-build/22.webp)

耐心等待源码下载就行

![](/images/posts/droidspaces-gki-local-build/23.webp)

拉取完成后脚本会自动填入内核源码对应的版本信息

![](/images/posts/droidspaces-gki-local-build/24.webp)

输入 7 选择对应的 root，我这里选择不 root

![](/images/posts/droidspaces-gki-local-build/25.webp)

接着输入 8 选择对应的 Droidspaces 补丁，6.1.118 应该选择 678，其他的版本自行测试，一般都是 678

![](/images/posts/droidspaces-gki-local-build/26.webp)

你也可以输入 0 来给你的内核自定义后缀，自定义构建时间，输入目录推荐不输入直接默认

![](/images/posts/droidspaces-gki-local-build/27.webp)

接着就可以输入 S 来开始编译内核了，输入 S 回车之后会进行源码压缩包的解压，解压完成之后会显示本次内核编译的概要，确认无误后就可以输入 y 下一步

![](/images/posts/droidspaces-gki-local-build/28.webp)

再次输入 y 下一步，脚本就会开始编译内核，剩下的流程为全自动，只需要喝杯茶内心等待就行。

![](/images/posts/droidspaces-gki-local-build/29.webp)

如果你的电脑 CPU 比较强的话，一般都能在 5 分钟之内完成编译

![](/images/posts/droidspaces-gki-local-build/30.webp)

接着将编译出来的 AnyKernel3 内核包复制到你的 Windows 目录里，在 WSL 里 Windows 目录都是挂载在 mnt 分区，比如 C 盘根目录就是 `/mnt/c`，我这里要复制到 E 盘，所以输入以下命令

```bash
cp /home/GCross/Droidspaces_GKI_Buildin_Local/build/out/android14-6.1.118-NoRoot-AnyKernel3.zip /mnt/e
```

这里的 `/home/GCross/Droidspaces_GKI_Buildin_Local/build/out/android14-6.1.118-NoRoot-AnyKernel3.zip` 对应的就是打包好的 AnyKernel3 内核包，到时候根据脚本给出的目录灵活变通就行

![](/images/posts/droidspaces-gki-local-build/31.webp)

注意：如果你选择了带内核 root，复制 AK3 目录的时候要把引号也复制上

![](/images/posts/droidspaces-gki-local-build/32.webp)

复制到 Windows 的目录之后，用自己的方法将 AK3 内核包传到设备 B 上

如果你选择了 root，此时还要去 github 上下载管理器，浏览器输入脚本给出的 action 页面链接，点击右上角的 Branch，选择 main 分支

![](/images/posts/droidspaces-gki-local-build/33.webp)

等待筛选完之后选择最新的 action，即最上面的

![](/images/posts/droidspaces-gki-local-build/34.webp)

下拉找到 manager-release，点击下载，解压后便是对应的管理器

![](/images/posts/droidspaces-gki-local-build/35.webp)

### 三、刷入内核

首先我们要先备份目前的原版 boot 镜像以防刷入的内核有问题，在设备 B 上打开多系统工具箱，点击菜单，点击 img 镜像文件操作

![](/images/posts/droidspaces-gki-local-build/36.webp)

点击“提取或刷写分区镜像”，搜索 boot，根据你设备当前的分区提取 boot，我这里是 a 分区，所以提取 boot_a。

![](/images/posts/droidspaces-gki-local-build/37.webp)

提取之后，打开文件管理器或者 MT 管理器，在/sdcard/Rannki 目录中找到刚刚提取的 boot，把 boot.img 复制或者分享到电脑中保存好

![](/images/posts/droidspaces-gki-local-build/38.webp)

接着打开 ABK，点击右上角的按钮切换到管理器界面

![](/images/posts/droidspaces-gki-local-build/39.webp)

点击图中的位置打开刷写界面

![](/images/posts/droidspaces-gki-local-build/40.webp)

选择 AnyKernel3 内核

![](/images/posts/droidspaces-gki-local-build/41.webp)

点击选择之后会弹出来让你选择对应的 AK3 内核包，找到并选择对应的文件点击确认

![](/images/posts/droidspaces-gki-local-build/42.webp)

接着往下滑，点击下一步

![](/images/posts/droidspaces-gki-local-build/43.webp)

等待内核刷写完成之后点击重启

![](/images/posts/droidspaces-gki-local-build/44.webp)

运气好进了系统的话，接下来打开 Droidspaces 检查要求是否通过

![](/images/posts/droidspaces-gki-local-build/45.webp)

看到像以上图里全打勾的话，恭喜你，成功编译并刷入了你的内核[针不戳]。

如果不喜欢用 ABK 的话可以使用 Kernel Flasher 刷入内核，具体可以看我的上一篇教程

### 四、救砖

如果不幸卡米，无限重启，就按着音量下键，直到重启进入 fastboot 模式

![](/images/posts/droidspaces-gki-local-build/46.webp)

用 USB 数据线连接你的设备与电脑，连接之后在电脑找到 fastboot 工具包目录，在上方地址栏里输入 cmd 并回车，就可以在这个目录下打开 cmd

![](/images/posts/droidspaces-gki-local-build/47.webp)

输入 `fastboot devices`，看看有没有设备

![](/images/posts/droidspaces-gki-local-build/48.webp)

如果有像这样的信息就说明你的设备连上电脑了，然后输入

```bash
fastboot flash boot
```

先不要回车，把你在设备 A 上通过多系统工具箱提取的 boot.img 拖进去，像这样

![](/images/posts/droidspaces-gki-local-build/49.webp)

接下来回车就能刷入 boot 把内核换回原来的了，接着输入 `fastboot reboot` 就能重启然后开机。

![](/images/posts/droidspaces-gki-local-build/50.webp)

接着再尝试其他 Droidspaces 补丁的内核或者找找为什么不开机的原因，重新刷入测试。

## 相关文档

1. [什么是 Droidspaces](https://www.coolapk.com/feed/71445199)
2. [云端编译教程](https://www.coolapk.com/feed/71592598)
3. [刷入内核后如何获取容器](https://www.coolapk.com/feed/72050609)
4. [ABK 是什么](https://www.coolapk.com/feed/71607083)
5. [什么是 NTsync](https://www.coolapk.com/feed/71322774)

## 涉及的项目

- [zzh20188/GKI_KernelSU_SUSFS](https://github.com/zzh20188/GKI_KernelSU_SUSFS)
- [ravindu644/Droidspaces-OSS](https://github.com/ravindu644/Droidspaces-OSS/)
- [Goldzxcbug/Droidspaces_Kernel_patch](https://github.com/Goldzxcbug/Droidspaces_Kernel_patch)
- [Goldzxcbug/Droidspaces-rootfs-KDE-builder](http://github.com/Goldzxcbug/Droidspaces-rootfs-KDE-builder)
- [cctv18/oppo_oplus_realme_sm8850](https://github.com/cctv18/oppo_oplus_realme_sm8850)
- [xingguangcuican6666/ABK](https://github.com/xingguangcuican6666/ABK)
- [404-GCross/GKI-Kernel-Source_Fetch](https://github.com/404-GCross/GKI-Kernel-Source_Fetch)

## 特别鸣谢

- [@cctv18_2](https://www.coolapk.com/u/cctv18_2)
- [@Goldbug](https://www.coolapk.com/u/Goldbug)

以及在酷安和群里解答我的疑惑的大佬们
