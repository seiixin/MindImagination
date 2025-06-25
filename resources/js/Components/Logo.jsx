// resources/js/Components/Logo.jsx
export default function Logo() {
  return (
    <div className="flex items-center gap-3 h-16 px-2">
      <img
        src="/Images/Logo.png"
        alt="Mind Imagination Logo"
        className="max-h-[40px] object-contain"
      />
      <span className="font-semibold tracking-widest text-white text-sm">
        MIND IMAGINATION
      </span>
    </div>
  );
}
