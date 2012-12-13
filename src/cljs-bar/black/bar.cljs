(ns black.bar)

(defn ^:export full-screen [] 
  (.moveTo js/window.self 0 0)
  (.resizeTo js/window.self js/screen.availWidth js/screen.availHeight))

(defn ^:export open-window [] 
  (.open js/window.self "http://www.google.com" "_blank" "titlebar=0"))

;javascript:window.open(self.location,"_blank","titlebar=0");