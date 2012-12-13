(defproject black "0.0.1-SNAPSHOT"
  :description "safari plugin that renders a 3d sheet in a maximized window"
  :url "http://black.halfrunt.net"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/clojurescript "0.0-1450"]]
  :plugins [[lein-cljsbuild "0.2.7"]]
  :source-paths ["src/clj"]
  :cljsbuild {:builds [{:id "global.js"
                        :source-path "src/cljs-global" 
                        :compiler {:output-to "black.safariextension/js/global.js" 
                       						 :optimizations :whitespace
                       						 :pretty-print true}}
                       {:id "bar.js"
                        :source-path "src/cljs-bar" 
                        :compiler {:output-to "black.safariextension/js/bar.js" 
                       						 :optimizations :whitespace
                       						 :pretty-print true}}
                       {:id "endscript.js"
                        :source-path "src/cljs-endscript" 
                        :compiler {:output-to "black.safariextension/js/endscript.js" 
                       						 :optimizations :whitespace
                       						 :pretty-print true}}]})

;TODO
; - put the 3d sheet in the icon
; - render the 3d sheet in the maximized window
