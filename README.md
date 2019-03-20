# Workbench Helper

> 工作台辅助 cli 工具

## Getting Started

```bash
$ npm i wbhelper -g
$ wbhelper -h
```

## Function

- **nei rpc 接口拉取代码生成**

通过在线调用 nei 提供的 api，在线指定对应的工程系统（需要提前申请 key）获取 nei 上定义好的接口数据，为了防止频繁调用nei 提供的 api 接口，默认会持续缓存第一次获取的所有 rpc 类以及方法名，可以通过加 `-f` 强制请求获取最新 nei 接口数据。

功能设计采用自定义选择类及方法的形式拉取数据并生成 server 端 controller、service、router，及 client 端 api 代码，最近还加入了 mock 接口的生成（注意：json 中只包含了基本响应模板，具体返回数据仍需要手动 copy 下）。代码生成路径可以通过在项目根目录下的 `.wbhelper.json` 文件中配置。

在生成代码中可以看到会默认带上 `/* wbneicontrol: on */` 的注释标识，由于是自动化生成的代码，并支持后续更新的代码覆盖功能，即加上这个标志，代表后续的该模块支持工具取覆盖。如果代码生成后希望手动修改内部代码，可以去掉注释或者将 on 修改为 off，这样在代码生成的时候会跳过这个接口。

功能在设计的时候大胆的希望能够将生成代码与已经存有的手写代码共存，即在代码生成的时候会严格的对于源文件的内容进行判断，所有已存在的接口工具在使用的时候均会跳过，避免后续会生成相同的接口或覆盖掉就接口数据的情况。

现在支持：

  * controller 代码的生成、增量覆盖
  * service 代码的生成及增量覆盖
  * router 代码的生成及增量覆盖
  * api 代码的生成及增量堵盖
  * mock 数据的文件生成

```json
// 配置说明
{
  "nei_config": {
    "controller_placement": "server/app/controller", // 配置 controller 代码文件夹生成相对路径
    "service_placement": "server/app/service", // 配置 service 代码生成文件夹相对路径
    "api_placement": "client/src/api/wbnei", // 配置 api 代码生成文件夹相对路径
    "router_placement": "server/app/nei", // 配置 router 代码生成文件夹相对路径
    "mock_placement": "server/mock", // 配置 mock 代码生成文件夹相对路径
    "prefixName": "" // 是否需要增加前缀，即如果 controller 配置在了子文件中，则调用接口时候需要增加的前缀
  }
}
```

- **七鱼消息主动模拟**

业务场景的功能无法在开发阶段覆盖，所以开发了这个功能，通过指定必要输入信息后，会开辟一个子工作进程不断向 qiyu 测试环境调用接口，实现模拟用户接线的功能模拟。

现在支持：

  * 可以指定客服推送会话（通过客服 ID 指定）
  * 指定固定用户或持续打入用户接线模式，并可以指定进线频率
  * 可指定消息发送频率
  * 可往会话文本消息中随机打入指定的关键词

- **模块代码自动生成**

受前面接口代码生成的启发，希望在一些通用模块上也能够一键生成模块代码，提高工作效率的同时减少后续相同业务的代码开发量。

现在支持：

  * views、components 空模板代码的生成
  * 单据业务模块代码的生成

```json
{
  "vue_config": {
    "view_placement": "client/src/views", // vue view 文件模板代码生成文件夹相对路径
    "component_placement": "client/src/components", // vue components 文件模板代码生成文件夹相对路径
    "billTable_placement": "client/src/views/workbench-bill" // 单据类型模块代码生成相对路径
  }
}
```
##

```bash
 __        __ ____   _   _        _
 \ \      / /| __ ) | | | |  ___ | | _ __    ___  _ __
  \ \ /\ / / |  _ \ | |_| | / _ \| || '_ \  / _ \| '__|
   \ V  V /  | |_) ||  _  ||  __/| || |_) ||  __/| |
    \_/\_/   |____/ |_| |_| \___||_|| .__/  \___||_|

Usage: wbhelper <command> [options]

命令：
  wbhelper completion  generate bash completion script
  wbhelper nei         Get the Api info from Nei, choose to generate common code.
  wbhelper new         快速生成通用模板代码文件
  wbhelper qiyu        Clone a repository into a new directory

Global Options:
  -h, --help     显示帮助信息                                                                                     [布尔]
  -v, --version  显示版本号                                                                                       [布尔]
```