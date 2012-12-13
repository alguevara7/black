(ns black.end)

(defn ^:export handleMessage [event]
	(js/alert "HERE!"))

(js/safari.self.addEventListener "message"  handleMessage false)
