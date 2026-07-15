import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

/**
 * 커서가 있는 블록에 하이라이트 클래스를 적용합니다.
 */
export const CurrentBlockHighlight = Extension.create({
  name: "currentBlockHighlight",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("currentBlockHighlight"),
        props: {
          decorations(state) {
            const { selection, doc } = state
            const { empty } = selection

            if (!empty) return null

            const $from = state.selection.$from
            let depth = $from.depth

            while (depth > 0) {
              const node = $from.node(depth)
              if (node.isBlock) {
                const pos = $from.before(depth)
                const to = pos + node.nodeSize
                return DecorationSet.create(doc, [
                  Decoration.node(pos, to, { class: "is-current-block" }),
                ])
              }
              depth--
            }

            return null
          },
        },
      }),
    ]
  },
})
