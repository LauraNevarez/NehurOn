package com.neuronapp.blocker

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.SharedPreferences
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import com.neuronapp.R

/**
 * Detecta la app en primer plano y, si el Modo Esencial
 * está activo y no estamos en minutos de descanso, dibuja una pantalla de bloqueo con SYSTEM_ALERT_WINDOW.
 */
class BlockerAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile var isRunning: Boolean = false
        @Volatile var activeInstance: BlockerAccessibilityService? = null
    }

    private val wm by lazy { getSystemService(Context.WINDOW_SERVICE) as WindowManager }
    private val prefs by lazy { getSharedPreferences(BlockerModule.PREFS, Context.MODE_PRIVATE) }
    private var overlay: View? = null

    private val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
        if (key == BlockerModule.KEY_ACTIVE && !prefs.getBoolean(BlockerModule.KEY_ACTIVE, false)) {
            hideOverlay()
        } else if (key == BlockerModule.KEY_BREAK_UNTIL) {
            val breakUntil = prefs.getLong(BlockerModule.KEY_BREAK_UNTIL, 0L)
            if (System.currentTimeMillis() < breakUntil) {
                hideOverlay()
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true
        activeInstance = this
        runCatching { prefs.registerOnSharedPreferenceChangeListener(listener) }
    }

    override fun onUnbind(intent: android.content.Intent?): Boolean {
        isRunning = false
        activeInstance = null
        return true // Permite que el sistema vuelva a vincular (onRebind) cuando sea necesario
    }

    override fun onRebind(intent: android.content.Intent?) {
        super.onRebind(intent)
        isRunning = true
        activeInstance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val eventType = event?.eventType ?: return
        if (eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            eventType != AccessibilityEvent.TYPE_WINDOWS_CHANGED) {
            return
        }

        val pkg = event.packageName?.toString() ?: return
        val className = event.className?.toString() ?: ""

        val active = prefs.getBoolean(BlockerModule.KEY_ACTIVE, false)
        val breakUntil = prefs.getLong(BlockerModule.KEY_BREAK_UNTIL, 0L)
        val inGrace = System.currentTimeMillis() < breakUntil
        val blocked = prefs.getStringSet(BlockerModule.KEY_BLOCKED, null) ?: emptySet()

        android.util.Log.d("Blocker", "pkg=$pkg class=$className active=$active inGrace=$inGrace blocked=${blocked.size}")

        // Si el modo no está activo o si el usuario está disfrutando sus minutos de gracia:
        if (!active || inGrace) {
            hideOverlay()
            return
        }

        if (blocked.contains(pkg)) {
            showOverlay()
        } else if (pkg == packageName) {
            // Si el usuario regresa a la interfaz de NeurOn (MainActivity), ocultar el overlay
            if (className.contains("MainActivity") || className.contains("Activity")) {
                hideOverlay()
            }
        } else if (pkg != "com.android.systemui") {
            // Launcher u otra app que no esté bloqueada
            hideOverlay()
        }
    }

    private fun showOverlay() {
        if (!Settings.canDrawOverlays(this)) return

        if (overlay != null) {
            if (overlay?.isAttachedToWindow == true) {
                return
            } else {
                hideOverlay()
            }
        }

        try {
            val dp = resources.displayMetrics.density
            val root = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                setBackgroundColor(Color.parseColor("#F20F1020"))
                setPadding((32 * dp).toInt(), 0, (32 * dp).toInt(), 0)
            }
            val logoSize = (124 * dp).toInt()
            val logoView = ImageView(this).apply {
                setImageResource(R.mipmap.ic_launcher_round)
                scaleType = ImageView.ScaleType.CENTER_CROP
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.parseColor("#F5B041"))
                }
                clipToOutline = true
                layoutParams = LinearLayout.LayoutParams(logoSize, logoSize).apply {
                    bottomMargin = (20 * dp).toInt()
                }
            }
            root.addView(logoView)
            root.addView(TextView(this).apply {
                text = "Modo Esencial · Enfoque"
                setTextColor(Color.WHITE)
                textSize = 24f
                setTypeface(null, Typeface.BOLD)
                gravity = Gravity.CENTER
            })
            root.addView(TextView(this).apply {
                text = "Esta app está bloqueada durante tu tiempo de enfoque.\nAl completar tu sesión recibirás tus minutos de gracia (100pts)."
                setTextColor(Color.parseColor("#9A9CC0"))
                textSize = 15f
                gravity = Gravity.CENTER
                setPadding(0, (12 * dp).toInt(), 0, (24 * dp).toInt())
            })
            root.addView(Button(this).apply {
                text = "Volver al inicio"
                setOnClickListener {
                    performGlobalAction(GLOBAL_ACTION_HOME)
                    hideOverlay()
                }
            })

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                PixelFormat.TRANSLUCENT
            )
            wm.addView(root, params)
            overlay = root
        } catch (e: Exception) {
            android.util.Log.e("Blocker", "Error al mostrar overlay", e)
            overlay = null
        }
    }

    private fun hideOverlay() {
        overlay?.let { view ->
            runCatching {
                if (view.isAttachedToWindow) {
                    wm.removeView(view)
                }
            }.onFailure {
                runCatching { wm.removeViewImmediate(view) }
            }
        }
        overlay = null
    }

    override fun onInterrupt() = hideOverlay()

    override fun onDestroy() {
        isRunning = false
        activeInstance = null
        hideOverlay()
        runCatching { prefs.unregisterOnSharedPreferenceChangeListener(listener) }
        super.onDestroy()
    }
}
